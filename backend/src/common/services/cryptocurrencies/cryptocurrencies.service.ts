import { HttpService } from '@nestjs/axios'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { lastValueFrom } from 'rxjs'
import { FindOptionsRelations, In, IsNull, Repository } from 'typeorm'
import { CoingeckoDomainService } from '../../../coingecko/coingecko.domain.service'
import { CoinInfoResponse } from '../../../coingecko/interface'
import { BaseService } from '../../../core/base.service'
import { FilesService } from '../../../files/files.service'
import { BucketSelector } from '../../../files/interfaces'
import { LoggerService } from '../../logger/logger.service'
import { SupportedBlockchains as SupportedBlockchainIds } from '../blockchains/interfaces'
import { CryptocurrencyAddress } from './cryptocurrency-address.entity'
import { Cryptocurrency } from './cryptocurrency.entity'
import { CryptocurrencyType } from './interfaces'

@Injectable()
export class CryptocurrenciesService extends BaseService<Cryptocurrency> {
  S3_BUCKET_PATH: string
  constructor(
    @InjectRepository(Cryptocurrency)
    private cryptocurrenciesRepository: Repository<Cryptocurrency>,
    @InjectRepository(CryptocurrencyAddress)
    private cryptocurrencyAddressesRepository: Repository<CryptocurrencyAddress>,
    private coingeckoDomainService: CoingeckoDomainService,
    private filesService: FilesService,
    private httpService: HttpService,
    private logger: LoggerService
  ) {
    super(cryptocurrenciesRepository)
    this.S3_BUCKET_PATH = 'cryptocurrency-images'
  }

  // Only works with coingecko for now
  async createNewErc20Token(address: string, blockchainId: string): Promise<Cryptocurrency> {
    if (blockchainId !== SupportedBlockchainIds.ETHEREUM_MAINNET) {
      this.logger.log('Only support ethereum mainnet for now.')
      return
    }

    if (address.toLowerCase() === '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {
      this.logger.log('Wrapped Ether not supported currently')
      return
    }

    const exist = await this.getByAddressAndBlockchain(address, blockchainId)

    if (exist) {
      return exist
    }

    // For ethereum and goerli, they are currently the same name
    const coingeckoChainName = blockchainId

    const coinInfo = await this.coingeckoDomainService.getCoinInfoFromContractAddressHistory(
      coingeckoChainName,
      address
    )
    if (!coinInfo) {
      //TODO: implement what we should do if coinGecko doesn't have the token. Where we should get name, symbol and etc
      return null
    }

    // TODO: this should be done in transaction
    // TODO: we are relying on the fact that coingeckoId needs to be unique
    let cryptocurrency = await this.findOne({
      where: {
        coingeckoId: coinInfo.id
      }
    })

    if (!cryptocurrency) {
      const cryptocurrencyToSave = Cryptocurrency.create({
        name: coinInfo.name,
        symbol: coinInfo.symbol.toUpperCase(),
        coingeckoId: coinInfo.id,
        isVerified: false,
        image: null
      })

      cryptocurrency = await this.cryptocurrenciesRepository.save(cryptocurrencyToSave)
    }

    const cryptocurrencyAddressToSave = CryptocurrencyAddress.create({
      cryptocurrency: cryptocurrency,
      blockchainId: blockchainId,
      type: CryptocurrencyType.TOKEN,
      address: address.toLowerCase(),
      decimal: coinInfo.detail_platforms[coingeckoChainName].decimal_place
    })

    await this.cryptocurrencyAddressesRepository.save(cryptocurrencyAddressToSave)

    //TODO: implement error logging correctly
    this.refreshImageForCryptocurrency(cryptocurrency.id, coinInfo).catch()

    return this.getById(cryptocurrency.id)
  }

  async refreshImageForCryptocurrency(cryptocurrencyId: string, coinInfo?: CoinInfoResponse) {
    const cryptocurrency = await this.getById(cryptocurrencyId)

    if (!coinInfo) {
      coinInfo = await this.coingeckoDomainService.getCoinInfoFromCoinId(cryptocurrency.coingeckoId)
    }

    if (coinInfo) {
      for (const imageSize in coinInfo.image) {
        const path = `${this.S3_BUCKET_PATH}/${cryptocurrency.symbol}_${cryptocurrency.coingeckoId}_${cryptocurrency.publicId}_${imageSize}.png`

        const imageResponse = await lastValueFrom(
          this.httpService.get(coinInfo.image[imageSize], { responseType: 'stream' })
        )

        const streamReadPromise = new Promise<Buffer>((resolve) => {
          const chunks = []
          imageResponse.data.on('data', (chunk) => {
            chunks.push(Buffer.from(chunk))
          })
          imageResponse.data.on('end', () => {
            resolve(Buffer.concat(chunks))
          })
        })

        const imageData = await streamReadPromise

        const s3Location = await this.filesService.uploadToS3(imageData, path, BucketSelector.PUBLIC)

        if (!cryptocurrency.image) {
          cryptocurrency.image = {}
        }
        cryptocurrency.image[imageSize] = s3Location

        await this.cryptocurrenciesRepository.update(cryptocurrency.id, { image: cryptocurrency.image })
      }
    }
  }

  async getById(id: string) {
    return this.findOne({
      where: {
        id: id
      },
      relations: ['addresses']
    })
  }

  getByAddressAndBlockchain(address: string, blockchainId: string) {
    return this.findOne({
      where: {
        addresses: {
          address: address ? address.toLowerCase() : null,
          blockchainId: blockchainId
        }
      },
      relations: { addresses: true }
    })
  }

  async getBySymbol(symbol: string) {
    return this.findOne({
      where: {
        symbol: symbol.toUpperCase()
      }
    })
  }

  async getAddressesPerCryptocurrencySymbol(symbol: string) {
    return this.cryptocurrencyAddressesRepository.find({
      where: {
        cryptocurrency: {
          symbol: symbol.toUpperCase()
        }
      }
    })
  }

  async getCoinByBlockchain(blockchainId: string): Promise<Cryptocurrency> {
    return this.findOne({
      where: {
        addresses: {
          type: CryptocurrencyType.COIN,
          blockchainId: blockchainId
        }
      },
      relations: { addresses: true }
    })
  }

  getDecimalForCryptocurrency(cryptocurrency: Cryptocurrency, blockchainId: string): number {
    return cryptocurrency.addresses.find((adr) => adr.blockchainId === blockchainId).decimal
  }

  async getByAddressAndBlockchainAndSymbol(
    address: string,
    blockchainId: string,
    symbol: string
  ): Promise<Cryptocurrency> {
    const findOptionsWhere = {
      symbol: symbol,
      addresses: {
        blockchainId: blockchainId
      }
    }

    if (address) {
      findOptionsWhere.addresses['type'] = CryptocurrencyType.TOKEN
      findOptionsWhere.addresses['address'] = address.toLowerCase()
    } else {
      findOptionsWhere.addresses['type'] = CryptocurrencyType.COIN
    }

    return this.findOne({
      where: findOptionsWhere,
      relations: ['addresses']
    })
  }

  async getAllByAddresses(tokenAddresses: string[], blockchainId: string) {
    return this.find({
      where: [
        {
          addresses: {
            address: In(tokenAddresses),
            blockchainId: blockchainId
          }
        },
        {
          addresses: {
            address: IsNull(),
            blockchainId: blockchainId
          }
        }
      ],
      relations: { addresses: true }
    })
  }

  getAllByPublicIds(publicIds: string[], relations?: FindOptionsRelations<Cryptocurrency>) {
    return this.find({
      where: {
        publicId: In(publicIds)
      },
      relations
    })
  }
}
