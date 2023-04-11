export enum FinancialTransformationsEventType {
  PREPROCESS_RAW_SYNC_ADDRESS = 'financialTransformation.preprocess.syncAddress',
  CORE_TRANSFORMATION_SYNC_ADDRESS = 'financialTransformation.core.syncAddress',
  ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET = 'financialTransformation.additional.perWallet',
  ADDITIONAL_TRANSFORMATION_SYNC_PER_WALLET_GROUP = 'financialTransformation.additional.perWalletGroup',
  OPERATIONAL_TRANSFORMATION_RESYNC_GAIN_LOSS_FOR_WALLET = 'financialTransformation.operational.resyncGainLossForGroup',
  OPERATIONAL_TRANSFORMATION_CHANGE_FIAT_CURRENCY_FOR_ORGANIZATION = 'financialTransformation.operational.changeFiatCurrencyForOrganization',
  OPERATIONAL_TRANSFORMATION_RESYNC_PRICE_FOR_TRANSACTION_CHILD = 'financialTransformation.operational.resyncPriceForTransactionChild'
}
export enum IngestionEventType {
  INGESTION_SYNC_ADDRESS = 'ingestion.syncAddress'
}

export class IngestionSyncEvent {
  constructor(public readonly ingestionTaskId: string) {}
}

export class ResyncGainLossForGroupEventParams {
  walletId: string
  blockchainId: string

  static map(params: { walletId: string; blockchainId: string }): ResyncGainLossForGroupEventParams {
    const result = new ResyncGainLossForGroupEventParams()
    result.walletId = params.walletId
    result.blockchainId = params.blockchainId
    return result
  }
}

export class ChangeFiatCurrencyForOrganizationEventParams {
  organizationId: string
  fiatCurrencyAlphabeticCode: string

  static map(params: {
    organizationId: string
    fiatCurrencyAlphabeticCode: string
  }): ChangeFiatCurrencyForOrganizationEventParams {
    const result = new ChangeFiatCurrencyForOrganizationEventParams()
    result.organizationId = params.organizationId
    result.fiatCurrencyAlphabeticCode = params.fiatCurrencyAlphabeticCode
    return result
  }
}
