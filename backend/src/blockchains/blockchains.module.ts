import { Module } from '@nestjs/common'
import { BlockchainsEntityModule } from '../common/services/blockchains/blockchains.entity.module'
import { BlockchainsController } from './blockchains.controller'

@Module({
  imports: [BlockchainsEntityModule],
  controllers: [BlockchainsController],
  providers: [],
  exports: []
})
export class BlockchainsModule {}
