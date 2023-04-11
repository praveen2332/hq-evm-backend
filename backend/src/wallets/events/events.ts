import { WalletStatusesEnum } from '../../common/services/wallets/interfaces'

export class WalletBalanceSyncPerWalletEventParams {
  constructor(public readonly walletId: string) {}
}

export class WalletBalanceSyncForOrganizationEventParams {
  constructor(public readonly organizationId: string) {}
}

export class WalletChangeSyncStatusEvent {
  constructor(
    public readonly payload: {
      address: string
      blockchainId: string
      organizationId: string
      status: WalletStatusesEnum
    }
  ) {}
}

export class WalletTransactionsSyncEvent {
  constructor(public readonly payload: { address: string; organizationId: string }) {}
}
