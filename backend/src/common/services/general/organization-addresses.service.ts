import { Injectable } from '@nestjs/common'
import { ILike } from 'typeorm'
import { SourceEth } from '../../../source-of-funds/source-eth-eoa/source-eth-eoa.entity'
import { SourceEthService } from '../../../source-of-funds/source-eth-eoa/source-eth-eoa.service'
import { SourceGnosis } from '../../../source-of-funds/source-gnosis/source-gnosis.entity'
import { SourceGnosisService } from '../../../source-of-funds/source-gnosis/source-gnosis.service'
import { Recipient } from '../contacts/recipient.entity'
import { RecipientsService } from '../contacts/recipients.service'
import { MemberAddressesService } from '../members/addresses/addresses.service'
import { MemberProfile } from '../members/member-profile.entity'
import { SourceType } from '../wallets/interfaces'
import { Wallet } from '../wallets/wallet.entity'
import { WalletsService } from '../wallets/wallets.service'

@Injectable()
export class OrganizationAddressesService {
  constructor(
    private sourceEthService: SourceEthService,
    private sourceGnosisService: SourceGnosisService,
    private walletsService: WalletsService,
    private recipientsService: RecipientsService,
    private memberAddressesService: MemberAddressesService
  ) {}

  // TODO: to standardize the return value with address revamp
  // Return the string name of the location now and empty string if not found
  async getAddressLocation(
    address: string,
    blockchainId: string,
    organizationId: string
  ): Promise<ValidationResponse | null> {
    const existWalletSource = await this.sourceEthService.findOne({
      where: { organizationId: organizationId, address: ILike(address), blockchainId: blockchainId }
    })

    if (existWalletSource) {
      return new ValidationResponse(EntityTypeEnum.WALLET_SOURCE_OF_FUNDS, existWalletSource, 'wallet source of funds')
    }

    const existSafeSource = await this.sourceGnosisService.findOne({
      where: { organizationId: organizationId, address: ILike(address), blockchainId: blockchainId }
    })

    if (existSafeSource) {
      return new ValidationResponse(EntityTypeEnum.SAFE_SOURCE_OF_FUNDS, existSafeSource, 'safe source of funds')
    }

    const existRecipient = await this.recipientsService.findOne({
      where: {
        organization: {
          id: organizationId
        },
        recipientAddresses: {
          address: ILike(address),
          blockchainId: blockchainId
        }
      }
    })

    if (existRecipient) {
      return new ValidationResponse(EntityTypeEnum.CONTACTS, existRecipient, 'contacts')
    }

    const existMemberAddress = await this.memberAddressesService.checkAddressByOrganization(
      address,
      blockchainId,
      organizationId
    )

    if (existMemberAddress) {
      return new ValidationResponse(EntityTypeEnum.MEMBERS, existMemberAddress.profile, 'members')
    }

    return null
  }

  async getAddressLocationForWallet(address: string, organizationId: string): Promise<ValidationResponse | null> {
    const formattedAddress = address.toLowerCase()

    const existWallet = await this.walletsService.findOne({
      where: {
        organization: {
          id: organizationId
        },
        address: formattedAddress
      }
    })

    if (existWallet) {
      if (existWallet.sourceType === SourceType.GNOSIS) {
        return new ValidationResponse(EntityTypeEnum.SAFE_SOURCE_OF_FUNDS, existWallet, 'safe wallet')
      } else {
        return new ValidationResponse(EntityTypeEnum.WALLET_SOURCE_OF_FUNDS, existWallet, 'wallets')
      }
    }

    const existRecipient = await this.recipientsService.findOne({
      where: {
        organization: {
          id: organizationId
        },
        recipientAddresses: {
          address: formattedAddress
        }
      }
    })

    if (existRecipient) {
      return new ValidationResponse(EntityTypeEnum.CONTACTS, existRecipient, 'contacts')
    }

    const existMemberAddress = await this.memberAddressesService.checkAddressByOrganizationNoChain(
      formattedAddress,
      organizationId
    )

    if (existMemberAddress) {
      return new ValidationResponse(EntityTypeEnum.MEMBERS, existMemberAddress.profile, 'members')
    }

    return null
  }

  //TODO: switch to isWallet function
  async isSourceOfFounds(address: string, organizationId: string): Promise<boolean> {
    const existWalletSource = await this.sourceEthService.findOne({
      where: { organizationId: organizationId, address: ILike(address) }
    })

    if (existWalletSource) {
      return true
    }

    const existSafeSource = await this.sourceGnosisService.findOne({
      where: { organizationId: organizationId, address: ILike(address) }
    })

    return !!existSafeSource
  }

  async isWallet(address: string, organizationId: string): Promise<boolean> {
    const existWallet = await this.walletsService.findOne({
      where: {
        organization: {
          id: organizationId
        },
        address: address.toLowerCase()
      }
    })

    return !!existWallet
  }
}

export enum EntityTypeEnum {
  WALLET_SOURCE_OF_FUNDS = 'WALLET_SOURCE_OF_FUNDS',
  WALLET = 'WALLET',
  SAFE_SOURCE_OF_FUNDS = 'SAFE_SOURCE_OF_FUNDS',
  CONTACTS = 'CONTACTS',
  MEMBERS = 'MEMBERS'
}

export class ValidationResponse {
  public entityType: EntityTypeEnum
  public entity: Recipient | MemberProfile | SourceGnosis | SourceEth | Wallet
  public message: string

  constructor(
    entityType: EntityTypeEnum,
    entity: Recipient | MemberProfile | SourceGnosis | SourceEth | Wallet,
    message: string
  ) {
    this.entityType = entityType
    this.entity = entity
    this.message = message
  }

  isNewOrSame(entity: Recipient | MemberProfile | SourceGnosis | SourceEth, entityType: EntityTypeEnum): boolean {
    if (!this.entity) {
      return true
    }

    return this.entity.id === entity.id && this.entityType === entityType
  }

  isNotNewOrSame(entity: Recipient | MemberProfile | SourceGnosis | SourceEth, entityType: EntityTypeEnum): boolean {
    return !this.isNewOrSame(entity, entityType)
  }
}
