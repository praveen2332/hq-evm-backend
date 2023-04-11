import { ApiProperty } from '@nestjs/swagger'
import { Entity, Column } from 'typeorm'
import { BaseEntity } from '../core/entities/base.entity'

@Entity()
export class Analysis extends BaseEntity {
  @Column()
  @ApiProperty()
  url: string

  @Column()
  @ApiProperty()
  event: string

  @Column({ nullable: true })
  @ApiProperty()
  referrer: string

  @Column()
  @ApiProperty()
  timestamp: Date

  @Column({ name: 'source_ip' })
  @ApiProperty()
  sourceIp: string

  @Column({ name: 'user_agent' })
  @ApiProperty()
  userAgent: string

  @Column({ type: 'json' })
  @ApiProperty()
  payload: any
}
