import { forwardRef, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { TokensController } from './tokens.controller'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { TokensEntityModule } from '../common/services/tokens/tokens.entity.module'

@Module({
  imports: [TokensEntityModule, forwardRef(() => AuthModule), OrganizationsEntityModule],
  controllers: [TokensController],
  providers: [],
  exports: []
})
export class TokensModule {}
