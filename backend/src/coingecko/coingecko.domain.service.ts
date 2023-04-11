import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AxiosResponse } from 'axios'
import { format, parse } from 'date-fns'
import Decimal from 'decimal.js'
import { lastValueFrom, map } from 'rxjs'
import { CoingeckoApiUrl } from '../common/constants'
import { LoggerService } from '../common/logger/logger.service'
import { CoinInfoResponse, HistoricalPriceResponse, MarketChartResponse } from './interface'

@Injectable()
export class CoingeckoDomainService {
  public static readonly COINGECKO_DATE_FORMAT = 'dd-MM-yyyy'
  private INVALID_TOKEN_CACHE: Set<string>
  apiKey: string

  constructor(private configService: ConfigService, private httpService: HttpService, private logger: LoggerService) {
    this.apiKey = this.configService.get('COINGECKO_API_KEY')
    this.INVALID_TOKEN_CACHE = new Set<string>()
  }

  async getMarketChartApi(
    coingeckoTokenId: string,
    currency: string,
    days: number | string = 'max',
    interval = 'daily'
  ): Promise<MarketChartResponse> {
    try {
      const url = `${CoingeckoApiUrl}/coins/${coingeckoTokenId}/market_chart?vs_currency=${currency}&days=${days}&interval=${interval}&x_cg_pro_api_key=${this.apiKey}`
      const priceResponse = await lastValueFrom<AxiosResponse<MarketChartResponse>>(this.httpService.get(url))
      return priceResponse.data
    } catch (error) {
      this.logger.error(
        `Can not get market chart for '${coingeckoTokenId}' at '${new Date().toLocaleString()}'`,
        error,
        {
          coingeckoTokenId,
          currency,
          days,
          interval
        }
      )
      return { prices: [] }
    }
  }

  async getHistoryPrice(coingeckoTokenId: string, date: string): Promise<{ [key: string]: number } | null> {
    try {
      const today = format(new Date(), CoingeckoDomainService.COINGECKO_DATE_FORMAT)
      const queryDate = parse(date, CoingeckoDomainService.COINGECKO_DATE_FORMAT, new Date())
      if (today !== format(queryDate, CoingeckoDomainService.COINGECKO_DATE_FORMAT)) {
        queryDate.setDate(queryDate.getDate() + 1)
      }
      const formattedQueryDate = format(queryDate, CoingeckoDomainService.COINGECKO_DATE_FORMAT)
      const url = `${CoingeckoApiUrl}/coins/${coingeckoTokenId}/history?date=${formattedQueryDate}&x_cg_pro_api_key=${this.apiKey}`
      const priceResponse = await lastValueFrom<AxiosResponse<HistoricalPriceResponse>>(this.httpService.get(url))
      if (priceResponse && priceResponse.data && priceResponse.data.market_data) {
        return priceResponse.data.market_data.current_price
      } else {
        this.logger.log(
          `No price history for '${coingeckoTokenId}' on query date '${formattedQueryDate}' at '${new Date().toLocaleString()}'`
        )
      }
      return null
    } catch (error) {
      this.logger.error(`Can not get history price from coingecko for token ${coingeckoTokenId}`, error, {
        coingeckoTokenId,
        date
      })
      return null
    }
  }

  async getHistoryFiatPrice(coingeckoTokenId: string, date: string, fiatSymbol: string): Promise<Decimal | null> {
    const formattedFiatSymbol = fiatSymbol.toLowerCase()
    const historyPrice = await this.getHistoryPrice(coingeckoTokenId, date)
    if (historyPrice) {
      const fiatPrice = historyPrice[formattedFiatSymbol]
      if (fiatPrice) {
        return new Decimal(fiatPrice)
      }
    }
    return null
  }
  async getCoinInfoFromContractAddressHistory(assetPlatform: string, contractAddress: string) {
    try {
      if (!this.INVALID_TOKEN_CACHE.has(contractAddress)) {
        const url = `${CoingeckoApiUrl}/coins/${assetPlatform}/contract/${contractAddress}?x_cg_pro_api_key=${this.apiKey}`
        const coinInfo = await lastValueFrom<AxiosResponse<CoinInfoResponse>>(this.httpService.get(url))

        //TODO: logs or throw error if not found
        if (coinInfo && coinInfo.status === 200 && coinInfo.data) {
          return coinInfo.data
        }
      }
    } catch (error) {
      this.logger.error(
        `Can not get coin info from coingecko for contract address ${contractAddress} on ${assetPlatform}`
      )
      this.INVALID_TOKEN_CACHE.add(contractAddress)
      return null
    }
  }

  async getCoinInfoFromCoinId(coingeckoId: string) {
    const url = `${CoingeckoApiUrl}/coins/${coingeckoId}?x_cg_pro_api_key=${this.apiKey}`
    const coinInfo = await lastValueFrom<AxiosResponse<CoinInfoResponse>>(this.httpService.get(url))

    //TODO: logs or throw error if not found
    if (coinInfo && coinInfo.status === 200 && coinInfo.data) {
      return coinInfo.data
    }
  }

  getSimplePrice(ids: string, vs_currencies: string) {
    return this.httpService
      .get(`${CoingeckoApiUrl}/simple/price?ids=${ids}&vs_currencies=${vs_currencies}&x_cg_pro_api_key=${this.apiKey}`)
      .pipe(map((res) => res.data))
  }

  getCoinsHistory(id: string, date: string) {
    return this.httpService
      .get(`${CoingeckoApiUrl}/coins/${id}/history?date=${date}&x_cg_pro_api_key=${this.apiKey}`)
      .pipe(map((res) => res.data))
  }
}
