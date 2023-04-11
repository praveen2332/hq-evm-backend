import { Module } from '@nestjs/common'
import { BlockExplorerModule } from '../block-explorers/block-explorer.module'
import { BlockchainsEntityModule } from '../common/services/blockchains/blockchains.entity.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { WalletsEntityModule } from '../common/services/wallets/wallets.entity.module'
import { CryptocurrenciesController } from './cryptocurrencies.controller'
import { CryptocurrenciesDomainService } from './cryptocurrencies.domain.service'

@Module({
  imports: [
    CryptocurrenciesEntityModule,
    BlockExplorerModule,
    WalletsEntityModule,
    MembersEntityModule,
    BlockchainsEntityModule
  ],
  controllers: [CryptocurrenciesController],
  providers: [CryptocurrenciesDomainService],
  exports: [CryptocurrenciesDomainService]
})
export class CryptocurrenciesModule {}
