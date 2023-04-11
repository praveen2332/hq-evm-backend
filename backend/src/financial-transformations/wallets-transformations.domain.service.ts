import { Injectable } from '@nestjs/common'
import Decimal from 'decimal.js'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import { GainsLossesService } from '../common/services/gains-losses/gains-losses.service'
import { TaxLot } from '../common/services/gains-losses/tax-lot.entity'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { PricesService } from '../prices/prices.service'
import {
  SourceType,
  TokenBalance,
  WalletBalancePerBlockchain,
  WalletStatusesEnum
} from '../common/services/wallets/interfaces'
import { TaxLotStatus } from '../common/services/gains-losses/interfaces'
import { CryptocurrencyResponseDto } from '../cryptocurrencies/interfaces'
import { Wallet } from '../common/services/wallets/wallet.entity'
import { FiatCurrency } from '../common/services/fiat-currencies/fiat-currency.entity'
import { BlockExplorersProviderEnum } from '../common/types/block-explorers-provider.enum'
import { AddressBalance } from '../block-explorers/types/balance'
import { formatUnits } from 'ethers/lib/utils'
import { BlockExplorerAdapterFactory } from '../block-explorers/block-explorer.adapter.factory'
import { CryptocurrenciesService } from '../common/services/cryptocurrencies/cryptocurrencies.service'
import { GnosisProviderService } from '../common/services/general/gnosis/gnosis-provider.service'
import { WalletGroupsService } from '../common/services/wallet-groups/wallet-groups.service'
import { BlockchainsService } from '../common/services/blockchains/blockchains.service'
import { LoggerService } from '../common/logger/logger.service'

@Injectable()
export class WalletsTransformationsDomainService {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly blockExplorerAdapterFactory: BlockExplorerAdapterFactory,
    private readonly cryptocurrenciesService: CryptocurrenciesService,
    private readonly gnosisProviderService: GnosisProviderService,
    private readonly walletGroupsService: WalletGroupsService,
    private readonly blockchainsService: BlockchainsService,
    private readonly pricesService: PricesService,
    private readonly gainsLossesService: GainsLossesService,
    private readonly financialTransactionsEntityService: FinancialTransactionsEntityService,
    private readonly logger: LoggerService
  ) {}

  getAllByOrganizationId(organizationId: string) {
    return this.walletsService.find({ where: { organization: { id: organizationId } } })
  }

  async syncBalanceFromChainForOrganization(organizationId: string) {
    const wallets = await this.getAllByOrganizationId(organizationId)
    for (const wallet of wallets) {
      await this.syncBalanceFromChain(wallet.id)
    }
  }

  async syncBalanceFromChain(walletId: string) {
    const wallet = await this.walletsService.get(walletId, {
      relations: {
        organization: {
          setting: {
            fiatCurrency: true
          }
        }
      }
    })
    const fiatCurrency = wallet.organization.setting.fiatCurrency
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    if (wallet.sourceType == SourceType.GNOSIS) {
      await this.syncGnosisBalance(wallet, fiatCurrency)
    } else if (wallet.sourceType == SourceType.ETH) {
      await this.syncEthBalance(wallet, fiatCurrency)
    }
  }

  async syncBalance(walletId: string) {
    const wallet = await this.walletsService.get(walletId, {
      relations: {
        organization: {
          setting: {
            fiatCurrency: true
          }
        }
      }
    })
    const fiatCurrency = wallet.organization.setting.fiatCurrency
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const walletBalanceForChains: WalletBalancePerBlockchain = {}

    const blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()

    for (const blockchainId of blockchainIds) {
      try {
        const tokenBalances: TokenBalance[] = []

        const financialTransactionChildren =
          await this.financialTransactionsEntityService.getAllChildrenFromOrganizationWithToAddressAndBlockchainId({
            organizationId: wallet.organization.id,
            toAddress: wallet.address,
            blockchainId: blockchainId
          })
        if (financialTransactionChildren?.length) {
          const childIds = financialTransactionChildren.map((child) => child.id)
          const taxLots = await this.gainsLossesService.getByFinancialTransactionChildIdsAndStatuses(
            childIds,
            [TaxLotStatus.AVAILABLE],
            { cryptocurrency: true }
          )

          const taxLotsGroupedByCryptocurrencyId: { [cryptocurrency: string]: TaxLot[] } = {}
          for (const taxLot of taxLots) {
            if (!taxLotsGroupedByCryptocurrencyId[taxLot.cryptocurrency.id]) {
              taxLotsGroupedByCryptocurrencyId[taxLot.cryptocurrency.id] = []
            }
            taxLotsGroupedByCryptocurrencyId[taxLot.cryptocurrency.id].push(taxLot)
          }

          for (const groupedTaxLots of Object.values(taxLotsGroupedByCryptocurrencyId)) {
            const balance = groupedTaxLots.reduce((sum, curr) => Decimal.add(sum, curr.amountAvailable), new Decimal(0))

            const cryptocurrency = groupedTaxLots.at(0).cryptocurrency

            const currentPrice = await this.pricesService.getCurrentFiatPriceByCryptocurrency(
              cryptocurrency,
              fiatCurrency.alphabeticCode
            )

            const fiatValue = Decimal.mul(balance, currentPrice)

            const finalTokenBalance: TokenBalance = {
              cryptocurrency: CryptocurrencyResponseDto.map(cryptocurrency),
              cryptocurrencyAmount: balance.toString(),
              fiatCurrency: fiatCurrency.alphabeticCode,
              fiatAmount: fiatValue.toString()
            }

            tokenBalances.push(finalTokenBalance)
          }

          walletBalanceForChains[blockchainId] = tokenBalances
        }
      } catch (error) {
        this.logger.error(`Error syncing balance for wallet ${wallet.address} on chain ${blockchainId}`, error, {
          walletId: wallet.id,
          fiatCurrencyId: fiatCurrency?.id
        })
      }
    }
    await this.walletsService.updateBalance(wallet.id, walletBalanceForChains)
  }

  private async syncGnosisBalance(wallet: Wallet, fiatCurrency: FiatCurrency) {
    if (wallet.sourceType !== SourceType.GNOSIS) {
      throw new Error('Wallet is not a Gnosis wallet')
    }
    if (!wallet.metadata?.blockchainId) {
      throw new Error('Wallet blockchainId is missing')
    }

    const gnosisBalance = await this.gnosisProviderService.getBalance({
      address: wallet.address,
      blockchainId: wallet.metadata.blockchainId
    })

    const walletBalancesPerChain = await this.getWalletBalancePerChain(
      gnosisBalance,
      wallet.metadata.blockchainId,
      fiatCurrency
    )

    await this.walletsService.updateBalance(wallet.id, { [wallet.metadata.blockchainId]: walletBalancesPerChain })
  }

  private async syncEthBalance(wallet: Wallet, fiatCurrency: FiatCurrency) {
    if (wallet.sourceType !== SourceType.ETH) {
      throw new Error('Wallet is not an ETH wallet')
    }

    const walletBalanceForChains: WalletBalancePerBlockchain = {}

    const blockchainsIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
    for (const blockchainId of blockchainsIds) {
      try {
        this.logger.log(`Syncing ETH balance for wallet ${wallet.address} on chain ${blockchainId}`)
        const adapter = this.blockExplorerAdapterFactory.getBlockExplorerAdapter(
          BlockExplorersProviderEnum.ALCHEMY,
          blockchainId
        )

        const balance = await adapter.getBalance(wallet.address)

        walletBalanceForChains[blockchainId] = await this.getWalletBalancePerChain(balance, blockchainId, fiatCurrency)
      } catch (error) {
        this.logger.error(`Error syncing ETH balance for wallet ${wallet.address} on chain ${blockchainId}`, error, {
          walletId: wallet.id,
          fiatCurrencyId: fiatCurrency.id
        })
      }
    }
    await this.walletsService.updateBalance(wallet.id, walletBalanceForChains)
  }

  private async getWalletBalancePerChain(
    totalBalances: AddressBalance[],
    blockchainId: string,
    fiatCurrency: FiatCurrency
  ): Promise<TokenBalance[]> {
    const tokenAddresses = totalBalances.map((token) => token.tokenAddress)
    const cryptocurrencies = await this.cryptocurrenciesService.getAllByAddresses(tokenAddresses, blockchainId)

    const tokenBalances: TokenBalance[] = []

    for (const address of tokenAddresses) {
      let crypto = cryptocurrencies.find((crypto) => crypto.addresses.find((a) => a.address === address))
      if (!crypto) {
        try {
          crypto = await this.cryptocurrenciesService.createNewErc20Token(address, blockchainId)
          if (!crypto) {
            continue
          }
        } catch (e) {
          continue
        }
      }
      const tokenBalance = totalBalances.find((token) => token.tokenAddress === address)

      // We need to do that, because the balance is in wei, and we need to convert it to the decimal of the token
      const decimal = crypto.addresses?.find((address) => address.blockchainId === blockchainId)?.decimal
      const formattedAmount = formatUnits(tokenBalance.balance, decimal)

      const fiatValue = await this.pricesService.getTotalFiatPriceByCryptocurrencyAndAmount(
        crypto,
        blockchainId,
        fiatCurrency.alphabeticCode,
        formattedAmount
      )

      const finalTokenBalance: TokenBalance = {
        cryptocurrency: CryptocurrencyResponseDto.map(crypto),
        cryptocurrencyAmount: formattedAmount,
        fiatCurrency: fiatCurrency.alphabeticCode,
        fiatAmount: fiatValue.toString()
      }

      tokenBalances.push(finalTokenBalance)
    }

    return tokenBalances
  }

  async maySetWalletsStatusForOrganization(organizationId: string, status: WalletStatusesEnum) {
    const blockchainIds = await this.blockchainsService.getEnabledBlockchainPublicIds()
    if (status === WalletStatusesEnum.SYNCED) {
      await this.walletsService.updateWalletsToSyncedForOrganization(organizationId, blockchainIds)
      return true
    } else if (status === WalletStatusesEnum.SYNCING) {
      return await this.walletsService.maySyncWalletsForOrganization(organizationId, blockchainIds)
    }
  }
}
