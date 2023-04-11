import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Wallet } from './wallet.entity'
import { WalletsService } from './wallets.service'

@Module({
  imports: [TypeOrmModule.forFeature([Wallet])],
  controllers: [],
  providers: [WalletsService],
  exports: [TypeOrmModule, WalletsService]
})
export class WalletsEntityModule {}
