import { Injectable } from '@nestjs/common'
import { format, parse } from 'date-fns'
import Decimal from 'decimal.js'
import { CoingeckoDomainService } from '../coingecko/coingecko.domain.service'
import { currencies } from '../common/constants'
import { LoggerService } from '../common/logger/logger.service'
import { CryptocurrenciesService } from '../common/services/cryptocurrencies/cryptocurrencies.service'
import { Cryptocurrency } from '../common/services/cryptocurrencies/cryptocurrency.entity'
import { PricesRepository } from '../common/services/prices/prices.repository'

@Injectable()
export class PricesService {
  dayInMilliseconds = 1000 * 60 * 60 * 24
  private todayPrices: Map<string, { [token: string]: { [currency: string]: number } }>

  constructor(
    private pricesRepository: PricesRepository,
    private coingeckoService: CoingeckoDomainService,
    private cryptocurrenciesService: CryptocurrenciesService,
    private logger: LoggerService
  ) {
    this.todayPrices = new Map<string, { [token: string]: { [currency: string]: number } }>()
  }

  async getAndUpdateHistoryPrice(cryptocurrencySymbol: string, date: string, isToday = false) {
    try {
      const cryptocurrency = await this.cryptocurrenciesService.getBySymbol(cryptocurrencySymbol)
      if (!cryptocurrency) {
        this.logger.error(`Can not get cryptocurrency by symbol '${cryptocurrencySymbol}`)
        return null
      }
      return await this.updatePriceForCryptocurrency(cryptocurrency, date, isToday)
    } catch (error) {
      this.logger.error(`Can not update history price`, error, { cryptocurrencySymbol, date, isToday })
      return null
    }
  }

  async getTotalFiatPriceByCryptocurrencyAndAmount(
    cryptocurrency: Cryptocurrency,
    blockchainId: string,
    currency: string,
    amount: string
  ): Promise<Decimal> {
    const pricePerCoin = await this.getCurrentFiatPriceByCryptocurrency(cryptocurrency, currency)
    return Decimal.mul(amount, pricePerCoin)
  }

  private async updatePriceForCryptocurrency(cryptocurrency: Cryptocurrency, date: string, isToday: boolean = false) {
    const currentPrice = await this.coingeckoService.getHistoryPrice(cryptocurrency.coingeckoId, date)
    if (currentPrice) {
      if (!isToday) {
        for (const currency of currencies) {
          try {
            await this.createOrUpdate(
              cryptocurrency,
              currency,
              currentPrice[currency],
              parse(date, CoingeckoDomainService.COINGECKO_DATE_FORMAT, new Date()).getTime()
            )
          } catch (e) {
            this.logger.error(`Can not update price for ${cryptocurrency.coingeckoId} with currency ${currency}`, e, {
              date
            })
          }
        }
      }
    }

    return currentPrice || null
  }

  async createOrUpdate(cryptocurrency: Cryptocurrency, currency: string, price: number, dateTime?: number) {
    const date = dateTime
      ? format(new Date(dateTime), CoingeckoDomainService.COINGECKO_DATE_FORMAT)
      : format(new Date(), CoingeckoDomainService.COINGECKO_DATE_FORMAT)
    const record = await this.pricesRepository.getOneByCurrencyAndDateAndId({
      date,
      cryptocurrencyId: cryptocurrency.id,
      currency
    })
    try {
      if (!record) {
        return this.pricesRepository.create({
          cryptocurrency: {
            id: cryptocurrency.id
          },
          tokenId: cryptocurrency.coingeckoId,
          currency,
          date,
          price
        })
      } else {
        return this.pricesRepository.update({ id: record.id, price })
      }
    } catch (error) {
      this.logger.error(
        `Price service createOrUpdate with cryptocurrencyId: ${cryptocurrency.id}, currency: ${currency}, price: ${price}, date: ${date} has error: ${error}`
      )
    }
  }

  async syncData() {
    const cryptocurrencies = await this.cryptocurrenciesService.getAll()
    const today = new Date()
    for (const cryptocurrency of cryptocurrencies) {
      for (const currency of currencies) {
        try {
          const priceResponse = await this.coingeckoService.getMarketChartApi(cryptocurrency.coingeckoId, currency)
          if (priceResponse.prices) {
            const length = priceResponse.prices.length
            for (let i = 0; i < length; i++) {
              const isNotToday =
                format(new Date(priceResponse.prices[i][0]), CoingeckoDomainService.COINGECKO_DATE_FORMAT) !==
                format(today, CoingeckoDomainService.COINGECKO_DATE_FORMAT)
              if (isNotToday) {
                await this.createOrUpdate(
                  cryptocurrency,
                  currency,
                  priceResponse.prices[i][1],
                  priceResponse.prices[i][0] - this.dayInMilliseconds
                )
              }
            }
          }
        } catch (error) {
          this.logger.error(`Can not sync prices for ${cryptocurrency.coingeckoId} with currency ${currency}`, error, {
            cryptocurrency,
            currency
          })
        }
      }
    }
  }

  async getPriceByCurrency(date: string, cryptocurrencySymbol: string, currency: string): Promise<number> {
    const today = new Date()
    const dateUTC = today.getUTCDate()
    const monthUTC = today.getUTCMonth() + 1
    const yearUTC = today.getUTCFullYear()
    const dateCheck = date.split('-')
    if (Number(dateCheck[0]) === dateUTC && Number(dateCheck[1]) === monthUTC && Number(dateCheck[2]) === yearUTC) {
      const todayPrice = this.todayPrices.get(date)
      if (!todayPrice) {
        this.todayPrices.clear()
        const res = await this.getAndUpdateHistoryPrice(cryptocurrencySymbol, date, true)
        if (res) {
          this.todayPrices.set(date, { [cryptocurrencySymbol]: res })
          return res[currency]
        }
        return 0
      }

      return todayPrice[cryptocurrencySymbol]?.[currency] ?? 0
    } else {
      const record = await this.pricesRepository.getOneByCurrencyAndDateAndSymbol({
        date,
        currency,
        symbol: cryptocurrencySymbol
      })
      if (!record) {
        const res = await this.getAndUpdateHistoryPrice(cryptocurrencySymbol, date)
        return res ? res[currency] : 0
      }
      return record.price
    }
  }

  async getFiatPriceByCryptocurrency(cryptocurrency: Cryptocurrency, date: Date, currency: string): Promise<Decimal> {
    const formattedCurrency = currency.toLowerCase()
    const today = this.dateStringConverter(new Date())
    const inputDate = this.dateStringConverter(date)

    let fiatPrice: Decimal = new Decimal(0)

    const savedPrice = await this.pricesRepository.getOneByCurrencyAndDateAndId({
      date: inputDate,
      currency: formattedCurrency,
      cryptocurrencyId: cryptocurrency.id
    })
    if (savedPrice) {
      fiatPrice = new Decimal(savedPrice.price)
      if (today === inputDate) {
        // Update today's price. Closure price will be set at 00:00 UTC for previous day in SchedulesService
        const newPrice = await this.createOrUpdate(
          cryptocurrency,
          formattedCurrency,
          fiatPrice.toNumber(),
          date.getTime()
        )
        fiatPrice = new Decimal(newPrice.price)
      }
    } else {
      const coinGeckoPrice = await this.coingeckoService.getHistoryFiatPrice(
        cryptocurrency.coingeckoId,
        inputDate,
        formattedCurrency
      )
      if (coinGeckoPrice) {
        fiatPrice = new Decimal(coinGeckoPrice)
        await this.createOrUpdate(cryptocurrency, formattedCurrency, fiatPrice.toNumber(), date.getTime())
      }
    }
    return fiatPrice
  }

  async getCurrentFiatPriceByCryptocurrency(cryptocurrency: Cryptocurrency, currency: string): Promise<Decimal> {
    return this.getFiatPriceByCryptocurrency(cryptocurrency, new Date(), currency)
  }

  dateStringConverter(date: Date) {
    return format(date, CoingeckoDomainService.COINGECKO_DATE_FORMAT)
  }

  async syncDaily(date?: string) {
    const cryptocurrencies = await this.cryptocurrenciesService.getAll()
    const syncDate = date
      ? parse(date, CoingeckoDomainService.COINGECKO_DATE_FORMAT, new Date())
      : Date.now() - this.dayInMilliseconds
    for (const cryptocurrency of cryptocurrencies) {
      try {
        await this.updatePriceForCryptocurrency(
          cryptocurrency,
          format(syncDate, CoingeckoDomainService.COINGECKO_DATE_FORMAT)
        )
      } catch (error) {
        this.logger.error(`Can not sync prices for date ${syncDate}`, error, {
          date,
          syncDate,
          cryptocurrency
        })
      }
    }
  }
}
