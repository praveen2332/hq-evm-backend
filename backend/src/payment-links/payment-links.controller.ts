import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreatePaymentLinkDto, PaymentLinkDto } from './interfaces'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { Action, Resource } from '../permissions/interfaces'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { LoggerService } from '../common/logger/logger.service'
import { PaymentLinkDomainService } from './payment-link.domain.service'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'

@ApiTags('payment-links')
@ApiBearerAuth()
@RequirePermissionResource(Resource.PAYMENT_LINKS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PaymentLinksController {
  constructor(private paymentLinkDomainService: PaymentLinkDomainService, private loggerService: LoggerService) {}

  @Get('')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: PaymentLinkDto, isArray: true })
  async getAll(@OrganizationId() organizationId: string) {
    try {
      return await this.paymentLinkDomainService.getAll(organizationId)
    } catch (e) {
      this.loggerService.error(`Error while getting payment links: ${e.message}`, e, { organizationId })
      throw e
    }
  }

  @Get(':id')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: PaymentLinkDto })
  async get(@Param('id') publicId: string, @OrganizationId() organizationId: string) {
    try {
      const paymentLink = await this.paymentLinkDomainService.getById({
        publicId,
        organizationId
      })
      if (paymentLink) {
        return paymentLink
      }
    } catch (e) {
      this.loggerService.error(`Error while getting payment link: ${e.message}`, e, {
        id: publicId,
        organizationId
      })
      throw e
    }
    throw new NotFoundException()
  }

  @Post()
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: PaymentLinkDto })
  async create(
    @OrganizationId() organizationId: string,
    @Body(new ValidationPipe()) createPaymentLinkDto: CreatePaymentLinkDto
  ) {
    return await this.paymentLinkDomainService.create(organizationId, createPaymentLinkDto)
  }

  @Delete(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @RequirePermissionAction(Action.DELETE)
  async delete(@OrganizationId() organizationId: string, @Param('id', new ParseUUIDPipe()) publicId: string) {
    try {
      await this.paymentLinkDomainService.delete(organizationId, publicId)
    } catch (e) {
      this.loggerService.error(`Can not delete payment link: ${e.message}`, e, {
        id: publicId,
        organizationId
      })
      throw e
    }
  }
}
