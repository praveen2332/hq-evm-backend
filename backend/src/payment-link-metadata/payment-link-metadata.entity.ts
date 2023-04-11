import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../core/entities/base.entity'

@Entity()
export class PaymentLinkMetadata extends BaseEntity {
  @Column()
  hash: string

  @Column({ name: 'from_address' })
  fromAddress: string

  @Column({ name: 'to_address' })
  toAddress: string

  @Column({ nullable: true })
  invoice: string

  @Column({ nullable: true })
  remarks: string

  @Column({ name: 'payment_link_id' })
  paymentLinkId: string

  @Column({ name: 'completed_at' })
  completedAt: Date

  @Column({ name: 'contact_details', type: 'json', nullable: true })
  contactDetails: any

  @Column({ name: 'cryptocurrency_amount', nullable: true })
  cryptocurrencyAmount: string

  @Column({ name: 'cryptocurrency_symbol', nullable: true })
  cryptocurrencySymbol: string

  @Column({ name: 'fiat_value', nullable: true })
  fiatValue: string

  static create(param: {
    hash: string
    fromAddress: string
    toAddress: string
    invoice: string
    paymentLinkId: string
    completedAt: Date
    remarks: string
    contactDetails: any
    cryptocurrencyAmount?: string
    cryptocurrencySymbol?: string
    fiatValue?: string
  }) {
    const paymentLink = new PaymentLinkMetadata()
    paymentLink.hash = param.hash
    paymentLink.fromAddress = param.fromAddress
    paymentLink.toAddress = param.toAddress
    paymentLink.invoice = param.invoice ?? null
    paymentLink.paymentLinkId = param.paymentLinkId
    paymentLink.completedAt = param.completedAt
    paymentLink.contactDetails = param.contactDetails ?? null
    paymentLink.remarks = param.remarks ?? null
    paymentLink.cryptocurrencyAmount = param.cryptocurrencyAmount ?? null
    paymentLink.cryptocurrencySymbol = param.cryptocurrencySymbol ?? null
    paymentLink.fiatValue = param.fiatValue ?? null
    return paymentLink
  }
}
