import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WalletGroup } from './wallet-group.entity'
import { WalletGroupsService } from './wallet-groups.service'

@Module({
  imports: [TypeOrmModule.forFeature([WalletGroup])],
  controllers: [],
  providers: [WalletGroupsService],
  exports: [TypeOrmModule, WalletGroupsService]
})
export class WalletGroupEntityModule {}
