import { ApiProperty } from '@nestjs/swagger'
import { Column, Entity, OneToMany, Unique } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Permission } from '../../../permissions/permission.entity'
import { ERole } from '../../../roles/interfaces'
import { Invitation } from '../invitations/invitation.entity'
import { Member } from '../members/member.entity'

@Entity()
@Unique(['name'])
export class Role extends BaseEntity {
  @Column({ type: 'enum', enum: ERole })
  @ApiProperty()
  name: ERole

  @OneToMany(() => Member, (member) => member.role)
  members: Member[]

  @OneToMany(() => Permission, (permission) => permission.role)
  permissions: Permission[]

  @OneToMany(() => Invitation, (invitation) => invitation.role)
  invitations: Invitation[]
}
