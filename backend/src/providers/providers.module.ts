import { forwardRef, Module } from '@nestjs/common'
import { ProvidersController } from './providers.controller'
import { AuthModule } from '../auth/auth.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'

@Module({
  imports: [AccountsEntityModule, ProvidersEntityModule, forwardRef(() => AuthModule)],
  providers: [],
  controllers: [ProvidersController],
  exports: []
})
export class ProvidersModule {}
