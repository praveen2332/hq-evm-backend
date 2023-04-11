import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { ContactDto } from '../common/services/contacts/contact'
import { ContactsService } from '../common/services/contacts/contacts.service'
import { Action, Resource } from '../permissions/interfaces'
import { GetContactsParams } from './interface'

@ApiTags('contacts')
@ApiBearerAuth()
@RequirePermissionResource(Resource.RECIPIENTS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class ContactsController {
  constructor(private contactsDomainService: ContactsService) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: ContactDto, isArray: true })
  async getAll(@Query() query: GetContactsParams, @OrganizationId() organizationId: string) {
    return this.contactsDomainService.getByOrganizationIdChainAndNameOrAddress({
      organizationId,
      blockchainId: query.blockchainId,
      nameOrAddress: query.nameOrAddress
    })
  }
}
