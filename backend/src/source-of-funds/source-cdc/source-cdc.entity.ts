import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column } from 'typeorm'
import { BaseEntity } from '../../core/entities/base.entity'

@Entity()
export class SourceCdc extends BaseEntity {
  @Column({ name: 'organization_id' })
  @ApiProperty()
  organizationId: string

  @Column({ name: 'api_key' })
  apiKey: string

  @Column({ name: 'secret_key' })
  secretKey: string
}
