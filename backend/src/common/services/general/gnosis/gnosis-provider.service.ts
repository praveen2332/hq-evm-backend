import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { catchError, firstValueFrom, lastValueFrom, map, of } from 'rxjs'
import { toChecksumAddress } from 'web3-utils'
import { SafeOwnerState } from '../../../../source-of-funds/interfaces'
import { GnosisService } from '../../../constants'
import { LoggerService } from '../../../logger/logger.service'
import {
  GnosisMultisigResponse,
  GnosisMultisigTransaction,
  GnosisSafeInfo,
  GnosisTokenBalance,
  GnosisWalletInfo
} from './interfaces'

@Injectable()
export class GnosisProviderService {
  constructor(private httpService: HttpService, private logger: LoggerService) {}

  async getSafeGnosis(params: { blockchainId: string; address: string }): Promise<GnosisWalletInfo | null> {
    const checkSumAddress = toChecksumAddress(params.address)
    const url = `${GnosisService[params.blockchainId]}/v1/safes/${checkSumAddress}`
    return firstValueFrom(
      this.httpService.get(url).pipe(
        map((res) => {
          if (res.data) {
            const owners = res.data.owners
            return {
              blockchainId: params.blockchainId,
              threshold: res.data.threshold,
              ownerAddresses: owners.map((owner) => ({ name: '', address: owner, state: SafeOwnerState.CURRENT }))
            } as GnosisWalletInfo
          }
          return null
        }),
        catchError((err) => {
          this.logger.error(`Error getting gnosis safe info for ${params.address}`, err, {
            url,
            checkSumAddress
          })
          return of(null)
        })
      )
    )
  }

  async getBalance(params: { blockchainId: string; address: string }): Promise<GnosisTokenBalance[]> {
    const checkSumAddress = toChecksumAddress(params.address)
    const url = `${GnosisService[params.blockchainId]}/v1/safes/${checkSumAddress}/balances`
    return lastValueFrom(
      this.httpService.get<GnosisTokenBalance[]>(url).pipe(
        map((res) =>
          res.data.map((balance) => ({
            ...balance,
            tokenAddress: balance.tokenAddress?.toLowerCase() ?? null
          }))
        )
      )
    )
  }

  getTxDetails(params: {
    blockchainId: string
    address: string
    hash: string
  }): Promise<GnosisMultisigTransaction | null> {
    const checkSumAddress = toChecksumAddress(params.address)
    const url = `${
      GnosisService[params.blockchainId]
    }/v1/safes/${checkSumAddress}/multisig-transactions/?executed=true&transaction_hash=${params.hash}`
    return lastValueFrom(
      this.httpService.get<GnosisMultisigResponse>(url).pipe(map((res) => res.data?.results?.[0] ?? null))
    )
  }

  async isGnosisSafe(params: { blockchainId: string; address: string }) {
    const checkSumAddress = toChecksumAddress(params.address)
    const url = `${GnosisService[params.blockchainId]}/v1/safes/${checkSumAddress}`
    try {
      const response = await lastValueFrom(this.httpService.get<GnosisSafeInfo>(url).pipe(map((res) => res.data)))
      return !!response.address
    } catch (error) {
      return false
    }
  }
}
