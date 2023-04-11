import { BadRequestException, Injectable } from '@nestjs/common'
import { AlchemyAdapter } from '../block-explorers/alchemy/alchemy.adapter'
import { BlockExplorerAdapterFactory } from '../block-explorers/block-explorer.adapter.factory'
import { BlockchainsService } from '../common/services/blockchains/blockchains.service'
import { CryptocurrenciesService } from '../common/services/cryptocurrencies/cryptocurrencies.service'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { BlockExplorersProviderEnum } from '../common/types/block-explorers-provider.enum'
import { CryptocurrencyResponseDto } from './interfaces'

@Injectable()
export class CryptocurrenciesDomainService {
  ALCHEMY_ADAPTERS: Map<string, AlchemyAdapter>

  constructor(
    private cryptocurrenciesService: CryptocurrenciesService,
    private walletsService: WalletsService,
    private blockchainsService: BlockchainsService,
    private readonly blockExplorerAdapterFactory: BlockExplorerAdapterFactory
  ) {}

  async initializeAlchemyAdapter() {
    this.ALCHEMY_ADAPTERS = new Map<string, AlchemyAdapter>()
    const blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
    for (const blockchainId in blockchainIds) {
      this.ALCHEMY_ADAPTERS.set(
        blockchainId,
        this.blockExplorerAdapterFactory.getBlockExplorerAdapter(BlockExplorersProviderEnum.ALCHEMY, blockchainId)
      )
    }
  }

  async getByOrganizationAndWalletPublicIds(
    organizationId: string,
    walletPublicIds: string[],
    blockchainIds: string[]
  ) {
    const cryptocurrencyDtos: CryptocurrencyResponseDto[] = []

    const wallets = await this.getWalletIdsFromPublicId(organizationId, walletPublicIds)

    for (const blockchainId of blockchainIds) {
      for (const wallet of wallets) {
        if (wallet.balance?.blockchains && wallet.balance?.blockchains[blockchainId]) {
          const cryptocurrencyList = wallet.balance?.blockchains[blockchainId]
          const cryptocurrencyIds = cryptocurrencyList.map((c) => c.cryptocurrency.publicId)
          const cryptocurrencies = await this.cryptocurrenciesService.getAllByPublicIds(cryptocurrencyIds, {
            addresses: true
          })
          cryptocurrencyDtos.push(...cryptocurrencies.map((c) => CryptocurrencyResponseDto.map(c)))
        }
      }
    }

    return cryptocurrencyDtos
  }

  async getWalletIdsFromPublicId(organizationId: string, walletPublicIds: string[]) {
    let wallets = await this.walletsService.getAllByOrganizationId(organizationId)

    if (walletPublicIds?.length) {
      let walletsTemp = wallets
      wallets = []

      for (const walletPublicId of walletPublicIds) {
        const wallet = walletsTemp.find((orgWalletId) => orgWalletId.publicId === walletPublicId)

        if (!wallet) {
          throw new BadRequestException('Please make sure you are specifying the correct walletIds')
        }

        wallets.push(wallet)
      }
    }

    return wallets
  }
}
