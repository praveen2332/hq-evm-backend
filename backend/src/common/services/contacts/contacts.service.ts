import { Injectable } from '@nestjs/common'
import { SourceOfFundsService } from '../../../source-of-funds/source-of-funds.service'
import { MembersService } from '../members/members.service'
import { WalletsService } from '../wallets/wallets.service'
import { ContactDto } from './contact'
import { RecipientsService } from './recipients.service'

@Injectable()
export class ContactsService {
  constructor(
    private membersService: MembersService,
    private recipientsService: RecipientsService,
    private sourceOfFundService: SourceOfFundsService,
    private walletsService: WalletsService
  ) {}

  async getByOrganizationIdChainAndNameOrAddress(params: {
    organizationId: string
    blockchainId?: string
    nameOrAddress?: string
  }) {
    const contacts = await Promise.all([
      this.recipientsService
        .getByOrganizationIdChainAndNameOrAddress(params)
        .then((recipients) => recipients.map((recipient) => ContactDto.mapFromRecipient(recipient))),
      this.sourceOfFundService
        .getByOrganizationIdNameOrAddress(params)
        .then((sources) =>
          sources.map(({ sourceOfFund, wallet }) => ContactDto.mapFromSourceOfFund(wallet, sourceOfFund))
        ),
      this.membersService
        .getByOrganizationIdChainAndNameOrAddress(params)
        .then((members) => members.map((member) => ContactDto.mapFromMember(member)))
    ])

    return contacts.flat()
  }

  async getByOrganizationIdAndNameOrAddress(params: { organizationId: string; nameOrAddress?: string }) {
    const contacts = await Promise.all([
      this.recipientsService
        .getByOrganizationIdChainAndNameOrAddress(params)
        .then((recipients) => recipients.map((recipient) => ContactDto.mapFromRecipient(recipient))),
      this.walletsService
        .getByOrganizationIdNameOrAddress(params)
        .then((sources) => sources.map((wallet) => ContactDto.mapFromWallet(wallet))),
      this.membersService
        .getByOrganizationIdChainAndNameOrAddress(params)
        .then((members) => members.map((member) => ContactDto.mapFromMember(member)))
    ])

    return contacts.flat()
  }

  groupContactDtosByAddress(contactDtos: ContactDto[]) {
    const contactsGrouped: { [address: string]: ContactDto } = {}

    for (const dto of contactDtos) {
      for (const address of dto.addresses) {
        contactsGrouped[address.address.toLowerCase()] = dto
      }
    }

    return contactsGrouped
  }
}
