import { BadRequestException, Injectable } from '@nestjs/common'
import Decimal from 'decimal.js'
import { dateHelper } from '../common/helpers/date.helper'
import { LoggerService } from '../common/logger/logger.service'
import { GainsLossesService } from '../common/services/gains-losses/gains-losses.service'
import { TaxLotStatus } from '../common/services/gains-losses/interfaces'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { PricesService } from '../prices/prices.service'
import { AssetResponseDto, TaxLotQueryParams, ToCreateAssetResponseDto } from './interfaces'

@Injectable()
export class AssetsDomainService {
  constructor(
    private logger: LoggerService,
    private gainsLossesService: GainsLossesService,
    private walletsService: WalletsService,
    private pricesService: PricesService
  ) {}

  async getAssetsForOrganization(
    organizationId: string,
    blockchainIds: string[],
    nameOrSymbol?: string
  ): Promise<AssetResponseDto[]> {
    const availableTaxLots = await this.gainsLossesService.getAvailableTaxLots(
      organizationId,
      blockchainIds,
      nameOrSymbol
    )
    const soldTaxLots = await this.gainsLossesService.getOneSoldTaxLotForCryptocurrency(
      organizationId,
      blockchainIds,
      nameOrSymbol
    )
    const uniqueSoldTaxLots = soldTaxLots.filter(
      (soldLot) =>
        !availableTaxLots.find((availableLot) => availableLot.cryptocurrency.id === soldLot.cryptocurrency.id)
    )

    const taxLots = [...availableTaxLots, ...uniqueSoldTaxLots]

    const toCreateAssetList: { [cryptocurrencyAddressId: string]: ToCreateAssetResponseDto } = {}

    for (const lot of taxLots) {
      const addressId = lot.cryptocurrency.addresses.find((c) => c.blockchainId === lot.blockchainId).id

      let dto: ToCreateAssetResponseDto = toCreateAssetList[addressId]

      if (!dto) {
        const currentFiatPrice = await this.pricesService.getFiatPriceByCryptocurrency(
          lot.cryptocurrency,
          dateHelper.getUTCTimestamp(),
          lot.costBasisFiatCurrency
        )

        dto = ToCreateAssetResponseDto.create({
          cryptocurrency: lot.cryptocurrency,
          blockchainId: lot.blockchainId,
          fiatCurrency: lot.costBasisFiatCurrency,
          totalUnits: '0',
          totalCostBasis: '0',
          currentFiatPrice: currentFiatPrice.toString()
        })
      }

      toCreateAssetList[addressId] = dto

      if (lot.status === TaxLotStatus.SOLD) {
        continue
      }

      dto.totalUnits = Decimal.add(dto.totalUnits, lot.amountAvailable).toString()
      dto.totalCostBasis = Decimal.add(
        dto.totalCostBasis,
        Decimal.mul(lot.amountAvailable, lot.costBasisPerUnit)
      ).toString()
    }

    const assetResponseDtos: AssetResponseDto[] = []

    for (const toCreate in toCreateAssetList) {
      assetResponseDtos.push(AssetResponseDto.map(toCreateAssetList[toCreate]))
    }

    return assetResponseDtos
  }

  async getPaginatedTaxLotsForAsset(organizationId: string, assetPublicId: string, options: TaxLotQueryParams) {
    let wallets = null
    let walletIds = null

    if (options.walletIds?.length) {
      wallets = await this.walletsService.getByOrganizationAndPublicIds(organizationId, options.walletIds)

      if (wallets?.length) {
        walletIds = wallets.map((wallet) => wallet.id)
      } else {
        throw new BadRequestException("walletGroupPublicIds do not match to any 'Wallet Group' in the organization")
      }
    }

    if (!wallets) {
      wallets = await this.walletsService.getAllByOrganizationId(organizationId)
    }

    return {
      paginatedTaxLots: await this.gainsLossesService.getAllTaxLotsAndCount(
        organizationId,
        assetPublicId,
        options,
        walletIds,
        options.blockchainId,
        options.status
      ),
      wallets
    }
  }

  // TODO: Descoped until end of April 2023
  // async getRevalueResponseDto(
  //   cryptocurrencyPublicId: string,
  //   organizationId: string,
  //   revalueAt: Date,
  //   newPricePerUnit: string,
  // ): Promise<RevalueResponseDto> {
  //   const cryptocurrency = await this.cryptocurrencyService.findByPublicId(cryptocurrencyPublicId)
  //   const { revalueTaxLotsGroup } = await this.gainsLossesService.getRevalueTaxLotsAndSale(
  //     organizationId,
  //     revalueAt,
  //   )

  //   const revalueTaxLotResponseDtos: RevalueTaxLotResponseDto[] = []

  //   for (const lot of Object.values(revalueTaxLotsGroup)) {
  //     const previousFiatValue = Decimal.mul(lot.amountAvailable, lot.costBasisPerUnit)
  //     const newFiatValue = Decimal.mul(lot.amountAvailable, newPricePerUnit)
  //     const unrealisedGainLoss = Decimal.sub(newFiatValue, previousFiatValue)

  //     const revalueTaxLotResponseDto: RevalueTaxLotResponseDto = RevalueTaxLotResponseDto.map({
  //       publicId: lot.publicId,
  //       affectedAmount: lot.amountAvailable,
  //       previousFiatValue: previousFiatValue.toString(),
  //       newFiatValue: newFiatValue.toString(),
  //       unrealisedGainLoss: unrealisedGainLoss.toString()
  //     })

  //     revalueTaxLotResponseDtos.push(revalueTaxLotResponseDto)
  //   }

  //   return RevalueResponseDto.map({
  //     cryptocurrency,
  //     fiatCurrency: 'usd',
  //     revalueTaxLotResponseDtos: revalueTaxLotResponseDtos
  //   })
  // }

  // async executeRevalue(
  //   cryptocurrencyPublicId: string,
  //   organizationId: string,
  //   revalueAt: Date,
  //   newPricePerUnit: string,
  //   accountId: string
  // ) {
  //   const cryptocurrency = await this.cryptocurrencyService.findByPublicId(cryptocurrencyPublicId)
  //   const { revalueTaxLotsGroup, taxLotSaleGroup } = await this.gainsLossesService.getRevalueTaxLotsAndSale(
  //     organizationId,
  //     revalueAt,
  //   )

  //   for (const lot of Object.values(revalueTaxLotsGroup)) {
  //     await this.gainsLossesService
  //     const previousFiatValue = Decimal.mul(lot.amountAvailable, lot.costBasisPerUnit)
  //     const newFiatValue = Decimal.mul(lot.amountAvailable, newPricePerUnit)
  //     const unrealisedGainLoss = Decimal.sub(newFiatValue, previousFiatValue)

  //     const revalueTaxLotResponseDto: RevalueTaxLotResponseDto = {
  //       publicId: lot.publicId,
  //       affectedAmount: lot.amountAvailable,
  //       previousFiatValue: previousFiatValue.toString(),
  //       newFiatValue: newFiatValue.toString(),
  //       unrealisedGainLoss: unrealisedGainLoss.toString()
  //     }

  //     // revalueTaxLotResponseDtos.push(revalueTaxLotResponseDto)
  //   }
  // }
}
