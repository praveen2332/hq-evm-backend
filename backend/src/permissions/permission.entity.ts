import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../core/entities/base.entity'
import { Action, Resource } from './interfaces'
import { Role } from '../common/services/roles/role.entity'

@Entity()
export class Permission extends BaseEntity {
  @ManyToOne(() => Role, (role) => role.permissions)
  @JoinColumn({ name: 'role_id' })
  @ApiProperty({ type: () => Role })
  role: Role

  @Column({ type: 'enum', enum: Resource })
  @ApiProperty()
  resource: string

  @Column({ type: 'enum', enum: Action })
  @ApiProperty()
  action: string
}
