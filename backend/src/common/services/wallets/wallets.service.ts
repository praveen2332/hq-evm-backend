import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsRelations, ILike, In, Repository } from 'typeorm'
import { FindOptionsWhere } from 'typeorm/find-options/FindOptionsWhere'
import { BaseService } from '../../../core/base.service'
import { PaginationParams, PaginationResponse } from '../../../core/interfaces'
import { dateHelper } from '../../helpers/date.helper'
import { WalletBalancePerBlockchain, WalletStatusPerChain, WalletStatusesEnum } from './interfaces'
import { Wallet } from './wallet.entity'

@Injectable()
export class WalletsService extends BaseService<Wallet> {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>
  ) {
    super(walletRepository)
  }

  getByOrganizationAndPublicId(organizationId: string, publicId: string, relations: FindOptionsRelations<Wallet> = {}) {
    return this.walletRepository.findOne({
      where: {
        publicId,
        organization: {
          id: organizationId
        }
      },
      relations
    })
  }

  getByOrganizationAndPublicIds(
    organizationId: string,
    publicIds: string[],
    relations: FindOptionsRelations<Wallet> = {}
  ) {
    return this.walletRepository.findOne({
      where: {
        publicId: In(publicIds),
        organization: {
          id: organizationId
        }
      },
      relations
    })
  }

  getByOrganizationIdAndAddress(organizationId: string, address: string, relations: FindOptionsRelations<Wallet> = {}) {
    return this.walletRepository.findOne({
      where: {
        address: address.toLowerCase(),
        organization: {
          id: organizationId
        }
      },
      relations
    })
  }

  getAllByOrganizationId(organizationId: string, relations: FindOptionsRelations<Wallet> = {}) {
    return this.walletRepository.find({
      where: {
        organization: {
          id: organizationId
        }
      },
      relations
    })
  }

  getAllByOrganizationIdAndWalletGroupId(
    organizationId: string,
    walletGroupId: string,
    relations: FindOptionsRelations<Wallet> = {}
  ) {
    return this.walletRepository.find({
      where: {
        organization: {
          id: organizationId
        },
        walletGroup: {
          id: walletGroupId
        }
      },
      relations
    })
  }

  async getAllByOrganizationIdGroupedByAddress(
    organizationId: string,
    relations: FindOptionsRelations<Wallet> = {}
  ): Promise<Map<string, Wallet>> {
    const wallets = await this.walletRepository.find({
      where: {
        organization: {
          id: organizationId
        }
      },
      relations
    })

    const map = new Map<string, Wallet>()
    wallets.map((wallet) => map.set(wallet.address, wallet))

    return map
  }

  getByWalletId(walletId: string, relations: FindOptionsRelations<Wallet> = {}): Promise<Wallet> {
    return this.walletRepository.findOne({
      where: {
        id: walletId
      },
      relations
    })
  }

  async updateBalance(id: string, balance: WalletBalancePerBlockchain) {
    return this.walletRepository.update(
      {
        id
      },
      {
        balance: {
          lastSyncedAt: new Date(),
          blockchains: balance
        }
      }
    )
  }

  async maySyncWalletsForOrganization(organizationId: string, blockchainIds: string[]): Promise<boolean> {
    const wallets = await this.getAllByOrganizationId(organizationId)

    const allSynced = wallets?.every((w) => w.status === WalletStatusesEnum.SYNCED)

    const walletIds = wallets.map((w) => w.id)
    if (allSynced) {
      await this.updateWalletsStatus(walletIds, blockchainIds, WalletStatusesEnum.SYNCING)
      return true
    }

    return false
  }

  async updateWalletsToSyncedForOrganization(organizationId: string, blockchainIds: string[]) {
    const wallets = await this.getAllByOrganizationId(organizationId)
    const walletIds = wallets.map((w) => w.id)
    await this.updateWalletsStatus(walletIds, blockchainIds, WalletStatusesEnum.SYNCED)
  }

  private async updateWalletsStatus(walletIds: string[], blockchainIds: string[], status: WalletStatusesEnum) {
    if (walletIds.length) {
      const statusPerChain: WalletStatusPerChain = blockchainIds.reduce((acc, blockchainId) => {
        acc[blockchainId] = status
        return acc
      }, {} as WalletStatusPerChain)
      await this.walletRepository.update(walletIds, {
        status: status,
        lastSyncedAt: dateHelper.getUTCTimestamp(),
        statusPerChain
      })
    }
  }

  async updateChainStatusByAddress(
    params: {
      address: string
      organizationId: string
      blockchainId: string
    },
    status: WalletStatusesEnum
  ) {
    const wallet = await this.getByOrganizationIdAndAddress(params.organizationId, params.address)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    return this.updateChainStatusByWallet(wallet, status, params.blockchainId)
  }

  async updateChainStatusByWallet(wallet: Wallet, status: WalletStatusesEnum, blockchainId: string) {
    if (status === WalletStatusesEnum.SYNCING) {
      return this.walletRepository.update(wallet.id, {
        status: WalletStatusesEnum.SYNCING,
        statusPerChain: {
          ...(wallet.statusPerChain ?? {}),
          [blockchainId]: status
        }
      })
    }
    if (status === WalletStatusesEnum.SYNCED) {
      //iterate over wallet.statusPerChain and check if all the others are synced
      const areOthersSynced = Object.entries(wallet.statusPerChain ?? {})
        ?.filter((statusPerChain) => statusPerChain?.at(0) !== blockchainId)
        .every(
          (statusPerChain) =>
            statusPerChain.at(1) === WalletStatusesEnum.SYNCED || status.at(1) === WalletStatusesEnum.FAILED
        )

      const updateData: Partial<Wallet> = {
        status: areOthersSynced ? WalletStatusesEnum.SYNCED : WalletStatusesEnum.SYNCING,
        statusPerChain: {
          ...(wallet.statusPerChain ?? {}),
          [blockchainId]: status
        }
      }

      if (areOthersSynced) {
        updateData.lastSyncedAt = dateHelper.getUTCTimestamp()
      }

      return this.walletRepository.update(wallet.id, updateData)
    }

    //TODO: probably we need to handle failed status in a different way... but for now it's ok
    return this.walletRepository.update(wallet.id, {
      statusPerChain: {
        ...(wallet.statusPerChain ?? {}),
        [blockchainId]: status
      }
    })
  }

  getByOrganizationIdNameOrAddress(params: { organizationId: string; nameOrAddress?: string }) {
    let where: FindOptionsWhere<Wallet>[] | FindOptionsWhere<Wallet> = {
      organization: {
        id: params.organizationId
      }
    }
    if (params.nameOrAddress) {
      where = [
        {
          organization: {
            id: params.organizationId
          },
          name: ILike(`%${params.nameOrAddress}%`)
        },
        {
          organization: {
            id: params.organizationId
          },
          address: ILike(`%${params.nameOrAddress}%`)
        }
      ]
    }

    return this.walletRepository.find({
      where: where,
      relations: { organization: true }
    })
  }

  async getAllPaging(
    options: PaginationParams,
    searchFields: string[],
    conditionalFields: FindOptionsWhere<Wallet>[] | FindOptionsWhere<Wallet> = null,
    relations: string[] = [],
    withDeleted: boolean = false
  ): Promise<PaginationResponse<Wallet>> {
    return super.getAllPaging(options, searchFields, conditionalFields as any, relations, withDeleted)
  }
}
