import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { Permission } from '../permissions/permission.entity'

export enum ERole {
  Owner = 'Owner',
  Admin = 'Admin',
  Employee = 'Employee',
  // TODO: To remove below once DB migration is done
  Vendor = 'Vendor',
  Auditor = 'Auditor',
  BillingManager = 'Billing Manager'
}

export class CreateRoleDto {
  @IsNotEmpty()
  @ApiProperty()
  name: ERole

  @IsNotEmpty()
  @ApiProperty()
  permissions: Permission[]
}

export class UpdateRoleDto {
  @IsNotEmpty()
  @ApiProperty()
  id: string

  @IsNotEmpty()
  @ApiProperty()
  name: ERole

  @IsNotEmpty()
  @ApiProperty()
  permissions: Permission[]
}
