import { Column, Entity, Generated, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'
import { Organization } from '../organizations/organization.entity'

@Entity()
export class PaymentLink extends BaseEntity {
  @Column({ name: 'public_id', type: 'uuid', unique: true })
  @Generated('uuid')
  publicId: string

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization

  @Column()
  address: string

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency

  static create(param: {
    blockchainId: string
    address: string
    organization: Organization
    cryptocurrency: Cryptocurrency
  }) {
    const paymentLink = new PaymentLink()
    paymentLink.blockchainId = param.blockchainId
    paymentLink.address = param.address
    paymentLink.organization = param.organization
    paymentLink.cryptocurrency = param.cryptocurrency
    return paymentLink
  }
}
