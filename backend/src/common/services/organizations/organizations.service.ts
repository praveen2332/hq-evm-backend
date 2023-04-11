import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Organization } from './organization.entity'

@Injectable()
export class OrganizationsService extends BaseService<Organization> {
  constructor(
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>
  ) {
    super(organizationsRepository)
  }

  async getOrganizationsByAccountId(accountId: string) {
    return await this.organizationsRepository.find({
      where: {
        members: {
          account: {
            id: accountId
          }
        }
      }
    })
  }
}
