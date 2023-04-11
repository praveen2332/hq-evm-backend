import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Unique } from 'typeorm'
import { BaseEntity } from '../../core/entities/base.entity'

@Entity()
@Unique(['organizationId', 'address'])
export class SourceEth extends BaseEntity {
  @Column({ name: 'organization_id' })
  @ApiProperty()
  organizationId: string

  @Column()
  @ApiProperty()
  address: string

  @Column({ name: 'blockchain_id', nullable: true })
  @ApiProperty()
  blockchainId: string
}
