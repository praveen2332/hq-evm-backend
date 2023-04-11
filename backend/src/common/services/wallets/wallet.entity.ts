import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { PublicEntity } from '../../../core/entities/base.entity'
import { GnosisWalletInfo } from '../general/gnosis/interfaces'
import { Organization } from '../organizations/organization.entity'
import { WalletGroup } from '../wallet-groups/wallet-group.entity'
import { SourceType, WalletBalance, WalletStatusPerChain, WalletStatusesEnum } from './interfaces'

@Entity()
export class Wallet extends PublicEntity {
  @Column()
  name: string

  @Column()
  address: string

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization

  @Column({ name: 'source_type', type: 'enum', enum: SourceType, default: SourceType.ETH })
  sourceType: SourceType

  @Column({ type: 'json', nullable: true })
  metadata: GnosisWalletInfo | null

  @Column({ name: 'flagged_at', nullable: true })
  flaggedAt: Date

  @ManyToOne(() => WalletGroup, (walletGroup) => walletGroup.wallets)
  @JoinColumn({ name: 'wallet_group_id' })
  walletGroup: WalletGroup

  @Column({ type: 'json', nullable: true })
  balance: WalletBalance

  @Column({ type: 'enum', enum: WalletStatusesEnum, default: WalletStatusesEnum.SYNCED })
  status: WalletStatusesEnum = WalletStatusesEnum.SYNCED

  @Column({ name: 'last_synced_at', nullable: true })
  lastSyncedAt: Date

  @Column({ name: 'status_per_chain', type: 'json', nullable: true })
  statusPerChain: WalletStatusPerChain | null

  static create(param: {
    name: string
    address: string
    organizationId: string
    sourceType: SourceType
    walletGroupId: string
    metadata: GnosisWalletInfo | null
  }) {
    const wallet = new Wallet()
    wallet.name = param.name
    wallet.address = param.address.toLowerCase()
    wallet.organization = { id: param.organizationId } as Organization
    wallet.sourceType = param.sourceType
    wallet.walletGroup = { id: param.walletGroupId } as WalletGroup
    wallet.metadata = param.metadata

    return wallet
  }
}
