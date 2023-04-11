import { forwardRef, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { RolesEntityModule } from '../common/services/roles/roles.entity.module'
import { GroupsModule } from '../groups/groups.module'
import { AccountsController } from './accounts.controller'
import { ChainsEntityModule } from '../common/services/chains/chains.entity.module'

@Module({
  imports: [
    RolesEntityModule,
    OrganizationsEntityModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    ChainsEntityModule,
    forwardRef(() => AuthModule),
    forwardRef(() => GroupsModule)
  ],
  providers: [],
  controllers: [AccountsController],
  exports: []
})
export class AccountsModule {}
