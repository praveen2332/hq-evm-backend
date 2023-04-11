import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ContactsController } from './contacts.controller'
import { LoggerModule } from '../common/logger/logger.module'
import { ContactsEntityModule } from '../common/services/contacts/contacts.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'

@Module({
  imports: [LoggerModule, ContactsEntityModule, MembersEntityModule, HttpModule],
  controllers: [ContactsController],
  providers: [],
  exports: []
})
export class ContactsModule {}
