import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { LoggerService } from '../common/logger/logger.service'
import { WalletGroup } from '../common/services/wallet-groups/wallet-group.entity'
import { WalletGroupsService } from '../common/services/wallet-groups/wallet-groups.service'
import { CreateWalletGroupDto, UpdateWalletGroupDto, WalletGroupDto, WalletGroupListDto } from './interfaces'

@Injectable()
export class WalletGroupsDomainService {
  allRelations = ['wallets']
  constructor(private logger: LoggerService, private walletGroupsService: WalletGroupsService) {}

  async getAll(organizationId: string) {
    const walletGroups = await this.walletGroupsService.find({
      where: {
        organization: { id: organizationId }
      },
      relations: this.allRelations
    })

    return walletGroups.map((source) => WalletGroupDto.map(source))
  }

  async getByOrganizationAndPublicId(publicId: string, organizationId: string) {
    const walletGroup = await this.walletGroupsService.getByOrganizationAndPublicId(
      organizationId,
      publicId,
      this.allRelations
    )
    if (walletGroup) {
      return WalletGroupDto.map(walletGroup)
    }
    throw new NotFoundException('Wallet Group not found')
  }

  async update(publicId: string, organizationId: string, updateWalletDto: UpdateWalletGroupDto) {
    const walletGroup = await this.walletGroupsService.getByOrganizationAndPublicId(organizationId, publicId)

    if (!walletGroup) {
      return null
    }

    const updatedFields = await this.walletGroupsService.partiallyUpdate(walletGroup.id, {
      name: updateWalletDto.name
    })

    return WalletGroupDto.map({
      ...walletGroup,
      ...updatedFields
    })
  }

  async delete(publicId: string, organizationId: string) {
    const walletGroup = await this.walletGroupsService.findOne({
      where: { publicId, organization: { id: organizationId } },
      relations: this.allRelations
    })

    if (walletGroup.wallets.length > 0) {
      throw new BadRequestException('Wallet group is not empty')
    }

    if (walletGroup) {
      return await this.walletGroupsService.softDelete(walletGroup.id)
    }
    throw new NotFoundException()
  }

  async create(organizationId: string, data: CreateWalletGroupDto): Promise<WalletGroupDto> {
    const doesNameExist = await this.doesNameExist(organizationId, data)
    if (doesNameExist) {
      throw new BadRequestException('This wallet name already exists')
    }

    try {
      const walletGroup = WalletGroup.create({
        name: data.name,
        organizationId
      })

      const createdWallet = await this.walletGroupsService.create(walletGroup)

      return WalletGroupDto.map(createdWallet)
    } catch (error) {
      this.logger.error(
        `Error creating wallet groups: ${error.message}`,
        { error },
        {
          organizationId,
          data
        }
      )
      throw new InternalServerErrorException()
    }
  }

  async doesNameExist(organizationId: string, data: CreateWalletGroupDto) {
    const wallet = await this.walletGroupsService.findOne({
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

  async getList(organizationId: string) {
    const walletGroups = await this.walletGroupsService.getByOrganization(organizationId, this.allRelations)
    return walletGroups.map((source) => WalletGroupListDto.map(source))
  }
}
