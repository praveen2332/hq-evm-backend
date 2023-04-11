import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../core/base.service'
import { Group } from './group.entity'

@Injectable()
export class GroupsService extends BaseService<Group> {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>
  ) {
    super(groupsRepository)
  }
}
