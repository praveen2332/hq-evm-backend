import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'
import { TaxLot } from './tax-lot.entity'

export enum TaxLotStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RECALCULATING = 'recalculating',
  INACTIVE = 'inactive'
}

export class MandatoryTaxLotFields {
  financialTransactionChildId: string
  cryptocurrency: Cryptocurrency
  blockchainId: string
  walletId: string
  organizationId: string
  updatedBy: string
}

export class CreateTaxLotDto extends MandatoryTaxLotFields {
  amountTotal: string
  amountAvailable: string
  status: TaxLotStatus
  statusReason: string | null
  purchasedAt: Date
  transferredAt: Date
  costBasisAmount: string
  costBasisPerUnit: string
  costBasisFiatCurrency: string
  previousTaxLotSaleId?: string | null
}

export class GetAvailableTaxLotDto extends MandatoryTaxLotFields {
  amountRequested: string
  soldAt: Date
  costBasisCalculationMethod: CostBasisCalculationMethod
}

export enum CostBasisCalculationMethod {
  FIFO = 'FIFO',
  LIFO = 'LIFO'
}

export class RevalueTaxlotDto {
  publicId: string
  newCostBasisPerUnit: string
  revalueAt: Date
  soldAt: Date
  updatedBy: string
}

export class CreateTaxLotSaleDto extends MandatoryTaxLotFields {
  taxLot: TaxLot
  soldAmount: string
  soldAt: Date
}
