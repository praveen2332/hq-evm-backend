import { Module } from '@nestjs/common'
import { LoggerModule } from '../common/logger/logger.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { WalletGroupEntityModule } from '../common/services/wallet-groups/wallet-group.entity.module'
import { WalletsEntityModule } from '../common/services/wallets/wallets.entity.module'
import { WalletGroupsController } from './wallet-groups.controller'
import { WalletGroupsDomainService } from './wallet-groups.domain.service'

@Module({
  imports: [WalletGroupEntityModule, WalletsEntityModule, MembersEntityModule, LoggerModule],
  controllers: [WalletGroupsController],
  providers: [WalletGroupsDomainService],
  exports: []
})
export class WalletGroupsModule {}
