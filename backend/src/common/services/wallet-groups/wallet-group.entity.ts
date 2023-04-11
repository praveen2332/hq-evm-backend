import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { PublicEntity } from '../../../core/entities/base.entity'
import { Organization } from '../organizations/organization.entity'
import { Wallet } from '../wallets/wallet.entity'

@Entity()
export class WalletGroup extends PublicEntity {
  @Column()
  name: string

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization

  @OneToMany(() => Wallet, (wallet) => wallet.walletGroup)
  wallets: Wallet[]

  static create(param: { organizationId: string; name: string }): WalletGroup {
    const walletGroup = new WalletGroup()
    walletGroup.name = param.name
    walletGroup.organization = { id: param.organizationId } as Organization

    return walletGroup
  }
}
