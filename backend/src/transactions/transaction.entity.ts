import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm'
import { Category } from '../categories/category.entity'
import { Account } from '../common/services/account/account.entity'
import { SourceOfFund } from '../source-of-funds/source-of-fund.entity'
import {
  DraftTransaction,
  ETransactionType,
  FTXTransaction,
  MetamaskTransaction,
  SafeTransaction,
  TransactionRecipient
} from './interfaces'

@Index(['hash', 'safeHash', 'source'])
@Unique(['hash', 'safeHash', 'source'])
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string

  @ManyToMany(() => Category, (category) => category.transactions)
  categories: Category[]

  @Column({ name: 'blockchain_id', nullable: true })
  blockchainId: string

  @ManyToOne(() => SourceOfFund, (source) => source.transactions)
  @JoinColumn({ name: 'source_of_fund_id' })
  source: SourceOfFund

  @ManyToOne(() => Account, (account) => account.transactions)
  @JoinColumn({ name: 'tx_creator' })
  txCreator: Account

  @Column({ nullable: true })
  @ApiProperty()
  comment: string

  @Column({ nullable: true })
  @ApiProperty()
  hash: string

  @Column({ name: 'safe_hash', nullable: true })
  @ApiProperty()
  safeHash: string

  @Column({ name: 'time_stamp', nullable: true })
  @ApiProperty()
  timeStamp: Date

  @Column({ name: 'is_executed' })
  @ApiProperty()
  isExecuted: boolean

  @Column({ name: 'submission_date', nullable: true })
  @ApiProperty()
  submissionDate: Date

  @Column({ type: 'json', name: 'metamask_transaction', nullable: true })
  @ApiProperty()
  metamaskTransaction: MetamaskTransaction

  @Column({ type: 'json', name: 'ftx_transaction', nullable: true })
  @ApiProperty()
  ftxTransaction: FTXTransaction

  @Column({ type: 'json', name: 'safe_transaction', nullable: true })
  @ApiProperty()
  safeTransaction: SafeTransaction

  @Column({ type: 'json', name: 'draft_transaction', nullable: true })
  @ApiProperty()
  draftTransaction: DraftTransaction[]

  @Column({ type: 'json', name: 'recipients', nullable: true })
  @ApiProperty()
  recipients: TransactionRecipient[]

  @Column({ name: 'token_address', nullable: true })
  @ApiProperty()
  tokenAddress: string

  @Column({ nullable: true })
  type?: ETransactionType

  @Column({ nullable: true })
  @ApiProperty()
  symbol: string

  @Column({ nullable: true })
  @ApiProperty()
  method: string

  @Column({ name: 'is_draft', nullable: true })
  @ApiProperty()
  isDraft: boolean

  @Column({ nullable: true, type: 'text' })
  @ApiProperty()
  files: string[]

  @Column({ nullable: true })
  @ApiProperty()
  pastUSDGasFee: string
}
