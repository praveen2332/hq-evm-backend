import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { FindOptionsRelations, In } from 'typeorm'
import { LoggerService } from '../common/logger/logger.service'
import { BlockchainsService } from '../common/services/blockchains/blockchains.service'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import { GainsLossesService } from '../common/services/gains-losses/gains-losses.service'
import { GnosisProviderService } from '../common/services/general/gnosis/gnosis-provider.service'
import { GnosisWalletInfo } from '../common/services/general/gnosis/interfaces'
import {
  OrganizationAddressesService,
  ValidationResponse
} from '../common/services/general/organization-addresses.service'
import { WalletGroup } from '../common/services/wallet-groups/wallet-group.entity'
import { WalletGroupsService } from '../common/services/wallet-groups/wallet-groups.service'
import { SourceType, WalletStatusesEnum } from '../common/services/wallets/interfaces'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { TaskSyncType } from '../core/events/event-types'
import { PaginationResponse } from '../core/interfaces'
import { FinancialTransformationsDomainService } from '../financial-transformations/financial-transformations.domain.service'
import { PricesService } from '../prices/prices.service'
import { WalletEventTypesEnum } from './events/event-types'
import { WalletBalanceSyncPerWalletEventParams } from './events/events'
import { CreateWalletDto, UpdateWalletDto, WalletDto, WalletQueryParams } from './interfaces'

@Injectable()
export class WalletsDomainService {
  allRelations = ['organization', 'walletGroup']
  allFindOptionsRelations: FindOptionsRelations<Wallet> = { organization: true, walletGroup: true }

  constructor(
    private readonly walletsService: WalletsService,
    private readonly financialTransactionsEntityService: FinancialTransactionsEntityService,
    private readonly financialTransformationsDomainService: FinancialTransformationsDomainService,
    private readonly addressesService: OrganizationAddressesService,
    private readonly logger: LoggerService,
    private readonly gnosisProviderService: GnosisProviderService,
    private readonly walletGroupsService: WalletGroupsService,
    private readonly blockchainsService: BlockchainsService,
    private readonly pricesService: PricesService,
    private readonly gainsLossesService: GainsLossesService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async getAllPaging(organizationId: string, query: WalletQueryParams) {
    let statusWhere = query.statuses?.length ? In(query.statuses) : undefined
    const wallets = await this.walletsService.getAllPaging(
      query,
      ['name'],
      {
        organization: {
          id: organizationId
        },
        status: statusWhere
      },
      this.allRelations
    )

    return PaginationResponse.from({
      currentPage: wallets.currentPage,
      totalItems: wallets.totalItems,
      limit: wallets.limit,
      items: wallets.items.map((source) => WalletDto.map(source))
    })
  }

  async getByOrganizationAndPublicId(publicId: string, organizationId: string) {
    const wallet = await this.walletsService.getByOrganizationAndPublicId(
      organizationId,
      publicId,
      this.allFindOptionsRelations
    )
    if (wallet) {
      return WalletDto.map(wallet)
    }
    return null
  }

  async update(publicId: string, organizationId: string, updateWalletDto: UpdateWalletDto) {
    const wallet = await this.walletsService.getByOrganizationAndPublicId(
      organizationId,
      publicId,
      this.allFindOptionsRelations
    )

    if (!wallet) {
      return null
    }

    const blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
    try {
      if (wallet) {
        for (const blockchainId of blockchainIds) {
          await this.changeStatus({
            address: wallet.address,
            blockchainId,
            organizationId,
            status: WalletStatusesEnum.SYNCING
          })
        }

        let walletGroup: WalletGroup = null
        if (updateWalletDto.walletGroupId) {
          walletGroup = await this.walletGroupsService.getByOrganizationAndPublicId(
            organizationId,
            updateWalletDto.walletGroupId
          )

          if (!walletGroup) {
            throw new BadRequestException(`Please input a valid wallet group id`)
          }
        }

        const updatedFields = await this.walletsService.partiallyUpdate(wallet.id, {
          name: updateWalletDto.name ?? undefined,
          flaggedAt: updateWalletDto.flagged ? new Date() : updateWalletDto.flagged === false ? null : undefined,
          walletGroup: walletGroup ? walletGroup : undefined
        })

        // TODO: we sync all for now to reflect the changes in transaction type correctly. e.g. Deposit (Group) -> Deposit (Internal)
        // This is very slow so we need to optimize this.
        if (walletGroup) {
          await this.syncAll(organizationId, TaskSyncType.FULL)
        }

        return WalletDto.map({
          ...wallet,
          ...updatedFields
        })
      }
    } catch (e) {
      this.logger.error('Error in updating wallet', wallet, e)
      for (const blockchainId of blockchainIds) {
        await this.changeStatus({
          address: wallet.address,
          blockchainId,
          organizationId,
          status: WalletStatusesEnum.SYNCED
        })
      }
    }
  }

  async delete(publicId: string, organizationId: string) {
    const wallet = await this.walletsService.getByOrganizationAndPublicId(
      organizationId,
      publicId,
      this.allFindOptionsRelations
    )

    const blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
    try {
      if (wallet) {
        for (const blockchainId of blockchainIds) {
          await this.changeStatus({
            address: wallet.address,
            blockchainId,
            organizationId,
            status: WalletStatusesEnum.SYNCING
          })
        }

        const affectedWalletAddresses = await this.financialTransactionsEntityService.deleteByOrganizationIdAndAddress({
          organizationId,
          wallet
        })

        for (const blockchainId of blockchainIds) {
          await this.gainsLossesService.deleteTaxLotSaleByWalletIdAndBlockchainId(wallet.id, blockchainId, true)
          await this.gainsLossesService.deleteTaxLotByWalletIdAndBlockchainId(wallet.id, blockchainId, true)
        }

        for (const affectedAddress of affectedWalletAddresses) {
          await this.financialTransformationsDomainService.sync({
            address: affectedAddress,
            organizationId,
            syncType: TaskSyncType.FULL
          })
        }
        await this.walletsService.softDelete(wallet.id)

        return true
      }
    } catch (e) {
      this.logger.error('Error in deleting wallet', wallet, e)
      for (const blockchainId of blockchainIds) {
        await this.changeStatus({
          address: wallet.address,
          blockchainId,
          organizationId,
          status: WalletStatusesEnum.SYNCED
        })
      }
    }
    return false
  }

  async create(organizationId: string, data: CreateWalletDto): Promise<WalletDto> {
    const addressLocation = await this.doesAddressExist(organizationId, data)

    if (!!addressLocation) {
      throw new BadRequestException(`This address exists in '${addressLocation.message}'.`)
    }

    const doesNameExist = await this.doesNameExist(organizationId, data)
    if (doesNameExist) {
      throw new BadRequestException('This wallet name already exists')
    }

    let metadata: GnosisWalletInfo | null = null

    if (data.sourceType === SourceType.GNOSIS) {
      metadata = await this.gnosisProviderService.getSafeGnosis({
        address: data.address,
        blockchainId: data.blockchainId
      })
      if (!metadata) {
        throw new BadRequestException('Gnosis wallet not found')
      }
    }

    const walletGroup = await this.walletGroupsService.getByOrganizationAndPublicId(organizationId, data.walletGroupId)

    if (!walletGroup) {
      throw new BadRequestException(`Wallet group not found for ${data.walletGroupId}`)
    }

    try {
      const wallet = Wallet.create({
        name: data.name,
        address: data.address,
        organizationId: organizationId,
        walletGroupId: walletGroup.id,
        sourceType: data.sourceType,
        metadata: metadata
      })

      const otherWallets = await this.walletsService.getAllByOrganizationId(organizationId)

      const createdWallet = await this.walletsService.create(wallet)

      await this.syncWallet(organizationId, createdWallet, TaskSyncType.FULL)

      // TODO: we sync all for now to reflect the changes in transaction type correctly. e.g. Deposit (Group) -> Deposit (Internal)
      // This is very slow so we need to optimize this.
      for (const otherWallet of otherWallets) {
        await this.syncWallet(organizationId, otherWallet, TaskSyncType.FULL)
      }

      //we should get the wallet again to get the all relations
      const latestWallet = await this.walletsService.get(createdWallet.id, { relations: this.allRelations })
      return WalletDto.map(latestWallet)
    } catch (error) {
      this.logger.error(
        `Error creating wallet: ${error.message}`,
        { error },
        {
          organizationId,
          data
        }
      )
      throw new InternalServerErrorException()
    }
  }

  async doesAddressExist(organizationId: string, data: CreateWalletDto): Promise<ValidationResponse> {
    const validationResponse = await this.addressesService.getAddressLocationForWallet(data.address, organizationId)
    if (validationResponse) {
      return validationResponse
    }
  }

  async doesNameExist(organizationId: string, data: CreateWalletDto) {
    const wallet = await this.walletsService.findOne({
      where: [
        {
          name: data.name.trim(),
          organization: {
            id: organizationId
          }
        }
      ]
    })
    return !!wallet
  }

  async syncWalletWithPublicIdIncrementally(organizationId: string, publicId: string) {
    const wallet = await this.walletsService.getByOrganizationAndPublicId(organizationId, publicId)
    if (!wallet) {
      throw new Error('Wallet not found')
    }
    await this.syncWallet(organizationId, wallet, TaskSyncType.INCREMENTAL)
  }

  async syncWallet(organizationId: string, wallet: Wallet, syncType: TaskSyncType) {
    try {
      // while we calculate the balance from blockchain we can do this independently. Eventually we should remove this and calculate
      // the balance from the financial transactions
      this.eventEmitter.emit(
        WalletEventTypesEnum.WALLET_SYNC_BALANCE_PER_WALLET,
        new WalletBalanceSyncPerWalletEventParams(wallet.id)
      )

      await this.financialTransformationsDomainService.sync({
        address: wallet.address,
        organizationId,
        syncType
      })
    } catch (e) {
      this.logger.error(`Error syncing wallet ${wallet.address} for organization ${organizationId}`, { error: e })
    }
  }

  async syncAll(organizationId: string, syncType: TaskSyncType) {
    const wallets = await this.walletsService.getAllByOrganizationId(organizationId)
    for (const wallet of wallets) {
      await this.syncWallet(organizationId, wallet, syncType)
    }
  }

  async changeStatus(payload: {
    address: string
    blockchainId: string
    organizationId: string
    status: WalletStatusesEnum
  }) {
    await this.walletsService.updateChainStatusByAddress(
      {
        blockchainId: payload.blockchainId,
        organizationId: payload.organizationId,
        address: payload.address
      },
      payload.status
    )
  }
}
