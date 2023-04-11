import { forwardRef, Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ChainsController } from './chains.controller'
import { ChainsEntityModule } from '../common/services/chains/chains.entity.module'

@Module({
  imports: [ChainsEntityModule, forwardRef(() => AuthModule)],
  controllers: [ChainsController],
  providers: [],
  exports: []
})
export class ChainsModule {}
