import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column } from 'typeorm'
import { BaseEntity } from '../../core/entities/base.entity'

@Entity()
export class SourceCoinbase extends BaseEntity {
  @Column({ name: 'organization_id' })
  @ApiProperty()
  organizationId: string

  @Column({ name: 'access_token' })
  accessToken: string

  @Column({ name: 'refresh_token' })
  refreshToken: string

  @Column({ name: 'expiry_date' })
  expiryDate: Date
}
