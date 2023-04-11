import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { FindOptionsRelations, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { OrganizationSetting } from './organization-setting.entity'

@Injectable()
export class OrganizationSettingsService extends BaseService<OrganizationSetting> {
  constructor(
    @InjectRepository(OrganizationSetting)
    private organizationSettingRepository: Repository<OrganizationSetting>
  ) {
    super(organizationSettingRepository)
  }

  getByOrganizationId(organizationId: string, relations: FindOptionsRelations<OrganizationSetting> = {}) {
    return this.organizationSettingRepository.findOne({
      where: {
        organization: {
          id: organizationId
        }
      },
      relations
    })
  }
}
