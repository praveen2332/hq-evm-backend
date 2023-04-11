import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { InvitationsEntityModule } from '../common/services/invitations/invitations.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { RolesEntityModule } from '../common/services/roles/roles.entity.module'
import { InvitationsController } from './invitations.controller'
import { LoggerModule } from '../common/logger/logger.module'

@Module({
  imports: [
    LoggerModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    InvitationsEntityModule,
    RolesEntityModule,
    OrganizationsEntityModule,
    MembersEntityModule,
    ConfigModule,
    HttpModule
  ],
  controllers: [InvitationsController],
  providers: [],
  exports: []
})
export class InvitationsModule {}
