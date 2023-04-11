import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { AxiosError, AxiosResponse } from 'axios'
import { Contract, providers } from 'ethers'
import { formatUnits } from 'ethers/lib/utils'
import { RestClient } from 'ftx-api'
import { catchError, lastValueFrom, map, switchMap, tap } from 'rxjs'
import { In, Repository } from 'typeorm'
import { CoingeckoApiUrl, Erc20ABI, GnosisService, networkConfigs } from '../common/constants'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { BaseService } from '../core/base.service'
import { SourceBalance, SourceFtxKey, SourceType, VaultResponse, VaultToken } from './interfaces'
import { SourceEth } from './source-eth-eoa/source-eth-eoa.entity'
import { SourceEthService } from './source-eth-eoa/source-eth-eoa.service'
import { SourceGnosis } from './source-gnosis/source-gnosis.entity'
import { SourceGnosisService } from './source-gnosis/source-gnosis.service'
import { SourceOfFund } from './source-of-fund.entity'

@Injectable()
export class SourceOfFundsService extends BaseService<SourceOfFund> {
  apiKey: string
  vaultUrl: string
  vaultRoleId: string
  vaultSecretId: string
  vaultVersion: string
  vaultNamespace: string
  environment: string

  constructor(
    @InjectRepository(SourceOfFund)
    private sourceOfFundsRepository: Repository<SourceOfFund>,
    private sourceEthService: SourceEthService,
    private sourceGnosisService: SourceGnosisService,
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    super(sourceOfFundsRepository)

    this.apiKey = this.configService.get('COINGECKO_API_KEY')
    this.vaultUrl = this.configService.get('VAULT_URL')
    this.vaultRoleId = this.configService.get('VAULT_ROLE_ID')
    this.vaultSecretId = this.configService.get('VAULT_SECRET_ID')
    this.vaultNamespace = this.configService.get('VAULT_NAMESPACE')
    this.vaultVersion = this.configService.get('VAULT_VERSION')
    this.environment = this.configService.get('VAULT_ENV')
  }

  getSourceFTX(apiKey: string, secretKey: string, subAccountName?: string) {
    return subAccountName && subAccountName !== ''
      ? new RestClient(apiKey, secretKey, { subAccountName })
      : new RestClient(apiKey, secretKey)
  }

  async getSourceKey(sourceId: string): Promise<VaultResponse<SourceFtxKey>> {
    const vaultToken = await this.getVaultToken()

    const url = this.vaultUrl + `${this.vaultVersion}/kv/${this.environment}-${sourceId}`
    const response: AxiosResponse<VaultResponse<SourceFtxKey>> = await lastValueFrom(
      this.httpService
        .get(url, {
          headers: {
            'X-Vault-Token': vaultToken.auth.client_token,
            'X-Vault-Namespace': this.vaultNamespace
          }
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data)
            throw 'An error happened!'
          })
        )
    )
    return response.data
  }

  async getVaultToken(): Promise<VaultResponse<VaultToken>> {
    const url = this.vaultUrl + this.vaultVersion + '/auth/approle/login'

    const payload = {
      role_id: this.vaultRoleId,
      secret_id: this.vaultSecretId
    }

    const response: AxiosResponse<VaultResponse<VaultToken>> = await lastValueFrom(
      this.httpService
        .post(url, payload, {
          headers: {
            'X-Vault-Namespace': this.vaultNamespace
          }
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data)
            throw 'An error happened!'
          })
        )
    )
    return response.data
  }

  async saveVaultData(sourceId: string, payload: SourceFtxKey) {
    const url = this.vaultUrl + this.vaultVersion + `/kv/${this.environment}-${sourceId}`
    const vaultToken = await this.getVaultToken()

    lastValueFrom(
      this.httpService
        .post(url, payload, {
          headers: {
            'X-Vault-Token': vaultToken.auth.client_token,
            'X-Vault-Namespace': this.vaultNamespace
          }
        })
        .pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data)
            throw 'An error happened!'
          })
        )
    )
  }

  async getSourceFTXBalance(apiKey: string, secretKey: string, subAccountName?: string) {
    try {
      const client = this.getSourceFTX(apiKey, secretKey, subAccountName)
      console.log({ client })
      const balance = await client.getBalances()
      return balance
    } catch (error) {
      return error.message
    }
  }

  getSourceGnosisBalance(blockchainId: string, address: string): Promise<SourceBalance> {
    const url = `${GnosisService[blockchainId]}/v1/safes/${address}/balances`
    const source: SourceBalance = {
      [blockchainId]: []
    }

    const chainId = blockchainId === SupportedBlockchains.GOERLI ? 5 : 1

    return lastValueFrom(
      this.httpService.get(url).pipe(
        tap((res) => {
          source[blockchainId] = res.data
            .filter((source) => {
              if (source.tokenAddress) {
                return networkConfigs[chainId].tokens.includes(source.tokenAddress.toLowerCase())
              }

              return true
            })
            .map((source) => {
              const token = source.tokenAddress ? source.tokenAddress.toLowerCase() : 'default'

              return {
                name: networkConfigs[chainId][token].symbol,
                id: networkConfigs[chainId][token].id,
                decimals: networkConfigs[chainId][token].decimals,
                balance: source.balance,
                usd: 0
              }
            })
        }),
        switchMap(() => {
          const ids = source[blockchainId].map((source) => source.id).join(',')
          const priceUrl = `${CoingeckoApiUrl}/simple/price?ids=${ids}&vs_currencies=usd&x_cg_pro_api_key=${this.apiKey}`
          return this.httpService.get(priceUrl)
        }),
        map((res) => {
          source[blockchainId] = source[blockchainId].map((token) => {
            token.usd = Number(formatUnits(token.balance, token.decimals)) * Number(res.data[token.id].usd)

            return token
          })

          return source
        })
      )
    )
  }

  async getSourceETHBalance(address: string): Promise<SourceBalance> {
    const source: SourceBalance = {}
    const blockchainIds = [SupportedBlockchains.ETHEREUM_MAINNET, SupportedBlockchains.GOERLI]

    for (const blockchainId of blockchainIds) {
      const chainId = blockchainId === SupportedBlockchains.GOERLI ? 5 : 1
      source[blockchainId] = []
      const provider = new providers.JsonRpcProvider(networkConfigs[chainId].rpcUrl)
      const ethBalance = await provider.getBalance(address)
      source[blockchainId].push({
        name: networkConfigs[chainId].default.symbol,
        id: networkConfigs[chainId].default.id,
        decimals: networkConfigs[chainId].default.decimals,
        balance: ethBalance.toString(),
        usd: 0
      })

      const tokenLength = networkConfigs[chainId].tokens.length
      for (let j = 0; j < tokenLength; j++) {
        const tokenContract = new Contract(networkConfigs[chainId].tokens[j], Erc20ABI, provider)
        const tokenBalance = await tokenContract.balanceOf(address)
        source[blockchainId].push({
          name: networkConfigs[chainId][networkConfigs[chainId].tokens[j]].symbol,
          id: networkConfigs[chainId][networkConfigs[chainId].tokens[j]].id,
          decimals: networkConfigs[chainId][networkConfigs[chainId].tokens[j]].decimals,
          balance: tokenBalance.toString(),
          usd: 0
        })
      }
    }

    const ids = 'xsgd,ethereum,straitsx-indonesia-rupiah,matic-network,binancecoin,usd-coin,dai,tether,sgd-tracker'
    const priceUrl = `${CoingeckoApiUrl}/simple/price?ids=${ids}&vs_currencies=usd&x_cg_pro_api_key=${this.apiKey}`
    return lastValueFrom(
      this.httpService.get(priceUrl).pipe(
        map((res) => {
          for (const blockchainId of blockchainIds) {
            source[blockchainId] = source[blockchainId].map((token) => {
              token.usd = Number(formatUnits(token.balance, token.decimals)) * Number(res.data[token.id].usd)

              return token
            })
          }
          return source
        })
      )
    )
  }

  async getByOrganizationIdNameOrAddress(params: { organizationId: string; nameOrAddress?: string }) {
    const sources: { sourceOfFund: SourceOfFund; wallet: SourceEth | SourceGnosis }[] = []
    const sourceOfFunds = await this.sourceOfFundsRepository.find({
      where: {
        organization: {
          id: params.organizationId
        }
      },
      relations: ['organization']
    })

    console.log(sourceOfFunds)

    const ethSourceOfFunds = sourceOfFunds.filter((source) => source.sourceType === SourceType.ETH)

    if (ethSourceOfFunds.length) {
      const ethSources = await this.sourceEthService.find({
        where: {
          organizationId: params.organizationId,
          id: In(ethSourceOfFunds.map((source) => source.sourceId))
        }
      })

      sources.push(
        ...ethSources.map((source) => ({
          sourceOfFund: ethSourceOfFunds.find((sourceOfFund) => sourceOfFund.sourceId === source.id),
          wallet: source
        }))
      )
    }

    const gnosisSourceOfFunds = sourceOfFunds.filter((source) => source.sourceType === SourceType.GNOSIS)

    if (gnosisSourceOfFunds.length) {
      const ethSources = await this.sourceGnosisService.find({
        where: {
          organizationId: params.organizationId,
          id: In(gnosisSourceOfFunds.map((source) => source.sourceId))
        }
      })

      sources.push(
        ...ethSources.map((source) => ({
          sourceOfFund: gnosisSourceOfFunds.find((sourceOfFund) => sourceOfFund.sourceId === source.id),
          wallet: source
        }))
      )
    }
    return sources.filter(({ sourceOfFund, wallet }) => {
      if (!params.nameOrAddress) {
        return true
      }
      return (
        wallet.address.toLowerCase().includes(params.nameOrAddress.toLowerCase()) ||
        sourceOfFund.name.toLowerCase().includes(params.nameOrAddress.toLowerCase())
      )
    })
  }
}
