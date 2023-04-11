import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SourceOfFundsModule } from '../../../source-of-funds/source-of-funds.module'
import { MembersEntityModule } from '../members/members.entity.module'
import { ProvidersEntityModule } from '../providers/providers.entity.module'
import { WalletsEntityModule } from '../wallets/wallets.entity.module'
import { RecipientAddress } from './addresses/address.entity'
import { RecipientAddressesService } from './addresses/addresses.service'
import { ContactsService } from './contacts.service'
import { ContactProvider } from './contacts/contact.entity'
import { ContactProvidersService } from './contacts/contacts.service'
import { RecipientContact } from './contacts/recipient-contact.entity'
import { RecipientContactsService } from './contacts/recipient-contact.service'
import { Recipient } from './recipient.entity'
import { RecipientsService } from './recipients.service'

@Module({
  imports: [
    ProvidersEntityModule,
    MembersEntityModule,
    WalletsEntityModule,
    forwardRef(() => SourceOfFundsModule), //we need only sourceOfFundsService,
    TypeOrmModule.forFeature([RecipientAddress, RecipientContact, ContactProvider, Recipient])
  ],
  providers: [
    RecipientAddressesService,
    RecipientContactsService,
    ContactProvidersService,
    RecipientsService,
    ContactsService
  ],
  exports: [
    TypeOrmModule,
    RecipientAddressesService,
    RecipientContactsService,
    ContactProvidersService,
    RecipientsService,
    ContactsService
  ]
})
export class ContactsEntityModule {}
