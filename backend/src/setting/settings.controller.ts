import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { LoggerService } from '../common/logger/logger.service'
import { Action, Resource } from '../permissions/interfaces'
import { SettingsDto, UpdateSettingDto } from './interfaces'
import { SettingsDomainService } from './settings.domain.service'

@ApiTags('setting')
@ApiBearerAuth()
@RequirePermissionResource(Resource.SETTINGS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class SettingsController {
  constructor(private logger: LoggerService, private settingsDomainService: SettingsDomainService) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse({ type: SettingsDto })
  async get(@OrganizationId() organizationId: string) {
    return await this.settingsDomainService.getByOrganizationId(organizationId)
  }

  @Put()
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse({ type: SettingsDto })
  async updateSource(@OrganizationId() organizationId: string, @Body() data: UpdateSettingDto) {
    return await this.settingsDomainService.update(organizationId, data)
  }
}
