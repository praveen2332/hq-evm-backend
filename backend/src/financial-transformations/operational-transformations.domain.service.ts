import { Injectable } from '@nestjs/common'
import Decimal from 'decimal.js'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import { GainsLossesService } from '../common/services/gains-losses/gains-losses.service'
import { TaxLotSale } from '../common/services/gains-losses/tax-lot-sale.entity'
import { TaxLot } from '../common/services/gains-losses/tax-lot.entity'
import { OrganizationSettingsService } from '../common/services/organization-settings/organization-settings.service'
import { WalletsService } from '../common/services/wallets/wallets.service'
import { PricesService } from '../prices/prices.service'
import { ChangeFiatCurrencyForOrganizationEventParams } from './events/events'

@Injectable()
export class OperationalTransformationsDomainService {
  constructor(
    private financialTransactionsEntityService: FinancialTransactionsEntityService,
    private organizationSettingsService: OrganizationSettingsService,
    private pricesService: PricesService,
    private gainsLossesService: GainsLossesService,
    private walletsService: WalletsService
  ) {}

  async executeResyncPriceForChildIdWorkflow(childId: string) {
    const child = await this.financialTransactionsEntityService.getChildWithMetadataById(childId)
    const metadata = child.financialTransactionChildMetadata
    const updatedBy = 'service_resync_price_for_child_id'

    const taxLot = await this.gainsLossesService.getTaxLotByChildId(child.id, { taxLotSales: true })
    const affectedTaxLotSales: TaxLotSale[] = []

    if (taxLot) {
      // TaxLotSales will only be impacted if the underlying tax lot is changed
      if (taxLot.costBasisPerUnit !== metadata.fiatAmountPerUnit) {
        const taxLotUpdate: Partial<TaxLot> = await this.gainsLossesService.generatePartialTaxLotForPriceUpdate({
          taxLot: taxLot,
          pricePerUnit: new Decimal(metadata.fiatAmountPerUnit),
          fiatCurrency: metadata.fiatCurrency,
          updatedBy
        })
        await this.gainsLossesService.updateTaxLot(taxLot.id, taxLotUpdate)

        if (taxLot.taxLotSales?.length) {
          for (const sale of taxLot.taxLotSales) {
            const taxLotSaleUpdate: Partial<TaxLotSale> =
              await this.gainsLossesService.generatePartialTaxLotSaleForPriceUpdate({
                taxLotSale: sale,
                pricePerUnit: new Decimal(metadata.fiatAmountPerUnit),
                fiatCurrency: metadata.fiatCurrency,
                updatedBy
              })

            await this.gainsLossesService.updateTaxLotSale(sale.id, taxLotSaleUpdate)

            affectedTaxLotSales.push({ ...sale, ...taxLotSaleUpdate })
          }
        }
      }
    }

    if (affectedTaxLotSales.length) {
      const salesGroupedByChildId: { [childId: string]: TaxLotSale[] } = {}

      for (const sale of affectedTaxLotSales) {
        if (!salesGroupedByChildId[sale.financialTransactionChildId]) {
          salesGroupedByChildId[sale.financialTransactionChildId] = []
        }
        salesGroupedByChildId[sale.financialTransactionChildId].push(sale)
      }

      for (const [childId, taxLotSales] of Object.entries(salesGroupedByChildId)) {
        const updatedChildMetadata =
          await this.financialTransactionsEntityService.generatePartialChildMetadataForGainLossUpdate({
            childId,
            taxLotSales,
            updatedBy
          })

        await this.financialTransactionsEntityService.updateChildMetadataByChildId(childId, updatedChildMetadata)
      }
    }
  }

  async executeChangeFiatCurrencyForOrganizationWorkflow(params: ChangeFiatCurrencyForOrganizationEventParams) {
    const children = await this.financialTransactionsEntityService.getAllChildrenFromOrganization(
      params.organizationId,
      {
        financialTransactionChildMetadata: true,
        cryptocurrency: true
      }
    )

    const fiatCurrency = params.fiatCurrencyAlphabeticCode

    const updatedBy = 'service_change_fiat_currency_for_organization'

    const affectedTaxLotSales: TaxLotSale[] = []
    for (const child of children) {
      const metadata = child.financialTransactionChildMetadata

      let newPricePerUnit = await this.pricesService.getFiatPriceByCryptocurrency(
        child.cryptocurrency,
        child.valueTimestamp,
        fiatCurrency
      )

      let updatedByUserPreviously = null
      //TODO: Unify this magis string in a common module
      if (
        metadata.fiatAmountUpdatedBy.startsWith('account_') ||
        metadata.fiatAmountPerUnitUpdatedBy.startsWith('account_')
      ) {
        const prevFiatCurrencyPrice = await this.pricesService.getFiatPriceByCryptocurrency(
          child.cryptocurrency,
          child.valueTimestamp,
          metadata.fiatCurrency
        )

        newPricePerUnit = Decimal.div(metadata.fiatAmountPerUnit, prevFiatCurrencyPrice).mul(newPricePerUnit)
        updatedByUserPreviously = metadata.fiatAmountUpdatedBy.startsWith('account_')
          ? metadata.fiatAmountUpdatedBy
          : metadata.fiatAmountPerUnitUpdatedBy
      }

      const updatedMetadata = await this.financialTransactionsEntityService.generatePartialChildMetadataForPriceUpdate({
        cryptocurrencyAmount: child.cryptocurrencyAmount,
        pricePerUnit: newPricePerUnit,
        fiatCurrency,
        updatedBy: updatedByUserPreviously ?? updatedBy
      })

      await this.financialTransactionsEntityService.updateChildMetadata(metadata.id, updatedMetadata)

      const taxLot = await this.gainsLossesService.getTaxLotByChildId(child.id, { taxLotSales: true })

      if (taxLot) {
        // TaxLotSales will only be impacted if the underlying tax lot is changes
        const taxLotUpdate: Partial<TaxLot> = await this.gainsLossesService.generatePartialTaxLotForPriceUpdate({
          taxLot: taxLot,
          pricePerUnit: newPricePerUnit,
          fiatCurrency,
          updatedBy
        })
        await this.gainsLossesService.updateTaxLot(taxLot.id, taxLotUpdate)

        if (taxLot.taxLotSales?.length) {
          for (const sale of taxLot.taxLotSales) {
            const taxLotSaleUpdate: Partial<TaxLotSale> =
              await this.gainsLossesService.generatePartialTaxLotSaleForPriceUpdate({
                taxLotSale: sale,
                pricePerUnit: newPricePerUnit,
                fiatCurrency,
                updatedBy
              })

            await this.gainsLossesService.updateTaxLotSale(sale.id, taxLotSaleUpdate)

            affectedTaxLotSales.push({ ...sale, ...taxLotSaleUpdate })
          }
        }
      }
    }

    if (affectedTaxLotSales.length) {
      const salesGroupedByChildId: { [childId: string]: TaxLotSale[] } = {}

      for (const sale of affectedTaxLotSales) {
        if (!salesGroupedByChildId[sale.financialTransactionChildId]) {
          salesGroupedByChildId[sale.financialTransactionChildId] = []
        }
        salesGroupedByChildId[sale.financialTransactionChildId].push(sale)
      }

      for (const [childId, taxLotSales] of Object.entries(salesGroupedByChildId)) {
        const updatedChildMetadata =
          await this.financialTransactionsEntityService.generatePartialChildMetadataForGainLossUpdate({
            childId,
            taxLotSales,
            updatedBy
          })

        await this.financialTransactionsEntityService.updateChildMetadataByChildId(childId, updatedChildMetadata)
      }
    }
  }
}
