import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Blockchain } from './blockchain.entity'
import { BlockchainsService } from './blockchains.service'

@Module({
  imports: [TypeOrmModule.forFeature([Blockchain])],
  controllers: [],
  providers: [BlockchainsService],
  exports: [TypeOrmModule, BlockchainsService]
})
export class BlockchainsEntityModule {}
