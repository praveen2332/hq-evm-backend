import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../core/base.service'
import { Permission } from './permission.entity'

@Injectable()
export class PermissionsService extends BaseService<Permission> {
  constructor(
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>
  ) {
    super(permissionsRepository)
  }
}
