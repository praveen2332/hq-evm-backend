import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm'
import { Category } from '../../../categories/category.entity'
import { BaseEntity } from '../../../core/entities/base.entity'
import { FinancialTransactionChild } from './financial-transaction-child.entity'
import {
  CreateFinancialTransactionChildDto,
  FinancialTransactionChildMetadataDirection,
  FinancialTransactionChildMetadataStatus,
  FinancialTransactionChildMetadataSubstatus,
  FinancialTransactionChildMetadataType,
  GainLossInclusionStatus
} from './interfaces'

@Entity()
export class FinancialTransactionChildMetadata extends BaseEntity {
  @OneToOne(
    () => FinancialTransactionChild,
    (financialTransactionChildMetadata) => financialTransactionChildMetadata.financialTransactionChildMetadata
  )
  @JoinColumn({ name: 'financial_transaction_child_id' })
  financialTransactionChild: FinancialTransactionChild

  @Column()
  direction: FinancialTransactionChildMetadataDirection

  @Column()
  type: FinancialTransactionChildMetadataType

  @Column({ type: 'enum', enum: FinancialTransactionChildMetadataStatus })
  status: FinancialTransactionChildMetadataStatus

  @Column({ type: 'enum', array: true, enum: FinancialTransactionChildMetadataSubstatus, default: [] })
  substatuses: FinancialTransactionChildMetadataSubstatus[] = []

  @Column({ name: 'fiat_currency', nullable: true })
  fiatCurrency: string

  @Column({ name: 'fiat_amount', nullable: true })
  fiatAmount: string

  @Column({ name: 'fiat_amount_updated_by', nullable: true })
  fiatAmountUpdatedBy: string

  @Column({ name: 'fiat_amount_updated_at', nullable: true })
  fiatAmountUpdatedAt: Date

  @Column({ name: 'fiat_amount_per_unit', nullable: true })
  fiatAmountPerUnit: string

  @Column({ name: 'fiat_amount_per_unit_updated_by', nullable: true })
  fiatAmountPerUnitUpdatedBy: string

  @Column({ name: 'fiat_amount_per_unit_updated_at', nullable: true })
  fiatAmountPerUnitUpdatedAt: Date

  @Column({ name: 'cost_basis', nullable: true })
  costBasis: string

  @Column({ name: 'cost_basis_updated_by', nullable: true })
  costBasisUpdatedBy: string

  @Column({ name: 'cost_basis_updated_at', nullable: true })
  costBasisUpdatedAt: Date

  @Column({ name: 'gain_loss', nullable: true })
  gainLoss: string

  @Column({ nullable: true })
  metadata: string

  @Column({ name: 'gnosis_metadata', nullable: true, type: 'json' })
  gnosisMetadata: FinancialTransactionChildGnosisMetadata

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category

  @Column({ nullable: true })
  note: string

  // We do not use enum because Typeorm will regenerate the migration file over and over again if we use enum
  @Column({ name: 'gain_loss_inclusion_status' })
  gainLossInclusionStatus: GainLossInclusionStatus

  static createFromDtoAndChild(
    dto: CreateFinancialTransactionChildDto,
    child: FinancialTransactionChild
  ): FinancialTransactionChildMetadata {
    const financialTransactionChildMetadata = new FinancialTransactionChildMetadata()
    financialTransactionChildMetadata.financialTransactionChild = child
    financialTransactionChildMetadata.type = dto.type
    financialTransactionChildMetadata.direction = dto.direction
    financialTransactionChildMetadata.status = dto.status
    financialTransactionChildMetadata.gainLossInclusionStatus = dto.gainLossInclusionStatus

    return financialTransactionChildMetadata
  }
}

export interface FinancialTransactionChildGnosisMetadata {
  // '2022-12-22T09:44:48Z'
  executionDate: string
  // '2022-12-22T09:44:48Z'
  submissionDate: string
  // '2022-12-22T09:44:48Z'
  modified: string
  // '0xd9bbc4c534f09b1b6651f4e44c16bc4fca1fccf11dae1cc05269e3626e9df517'
  safeTxHash: string
  confirmationsRequired: number
  confirmations: FinancialTransactionGnosisConfirmation[]
}

export interface FinancialTransactionGnosisConfirmation {
  // '0x2170430E7c8DE0A588E5DA04823E2c6a8c658D2f'
  owner: string
  // '2022-12-22T09:44:48Z'
  submissionDate: string
  transactionHash: string
  // ETH_SIGN / APPROVED_HASH
  signatureType: string
}
