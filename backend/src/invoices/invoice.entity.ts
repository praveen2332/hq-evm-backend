import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column } from 'typeorm'
import { BaseEntity } from '../core/entities/base.entity'
import { InvoicePerson, Item } from './interface'

@Entity()
export class Invoice extends BaseEntity {
  @Column({ name: 'invoice_number' })
  @ApiProperty()
  invoiceNumber: string

  @Column({ type: 'json' })
  from: InvoicePerson

  @Column({ type: 'json' })
  @ApiProperty()
  to: InvoicePerson

  @Column({ nullable: true })
  @ApiProperty()
  information: string

  @Column({ nullable: true })
  @ApiProperty()
  recipient: string

  @Column({ nullable: true })
  @ApiProperty()
  network: string

  @Column({ type: 'json' })
  @ApiProperty()
  items: Item[]
}
