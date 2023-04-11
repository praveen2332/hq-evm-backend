import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, Unique } from 'typeorm'
import { BaseEntity } from '../../core/entities/base.entity'
import { SafeOwner } from '../interfaces'

@Entity()
@Unique(['organizationId', 'address'])
export class SourceGnosis extends BaseEntity {
  @Column({ name: 'organization_id' })
  @ApiProperty()
  organizationId: string

  @Column()
  address: string

  @Column({ name: 'blockchain_id', nullable: true })
  blockchainId: string

  @Column()
  threshold: number

  @Column({ name: 'owner_addresses', type: 'json' })
  ownerAddresses: SafeOwner[]
}
