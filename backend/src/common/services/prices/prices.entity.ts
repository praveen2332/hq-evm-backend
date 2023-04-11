import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Cryptocurrency } from '../cryptocurrencies/cryptocurrency.entity'

@Entity()
@Unique('UQ_price_cryptocurrency_id_date_currency', ['cryptocurrency', 'date', 'currency'])
export class Price extends BaseEntity {
  //TODO: keep for backward compatibility, remove later
  @Column({ nullable: true })
  @ApiProperty()
  tokenId: string

  @ManyToOne(() => Cryptocurrency)
  @JoinColumn({ name: 'cryptocurrency_id' })
  @ApiProperty()
  cryptocurrency: Cryptocurrency

  @Column()
  @ApiProperty()
  date: string

  @Column()
  @ApiProperty()
  currency: string

  @Column({ type: 'numeric', nullable: true })
  @ApiProperty()
  price: number
}
