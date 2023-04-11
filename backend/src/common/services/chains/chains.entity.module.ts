import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Chain } from './chain.entity'
import { ChainsService } from './chains.service'

@Module({
  imports: [TypeOrmModule.forFeature([Chain])],
  controllers: [],
  providers: [ChainsService],
  exports: [TypeOrmModule, ChainsService]
})
export class ChainsEntityModule {}
