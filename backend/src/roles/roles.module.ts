import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RolesController } from './roles.controller'
import { Role } from '../common/services/roles/role.entity'
import { AuthModule } from '../auth/auth.module'
import { RolesEntityModule } from '../common/services/roles/roles.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    RolesEntityModule,
    MembersEntityModule,
    OrganizationsEntityModule,
    AccountsEntityModule,
    forwardRef(() => AuthModule)
  ],
  providers: [],
  controllers: [RolesController],
  exports: []
})
export class RolesModule {}
