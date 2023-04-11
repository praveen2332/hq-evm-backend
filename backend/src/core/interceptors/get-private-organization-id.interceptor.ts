import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  NestMiddleware,
  NotFoundException
} from '@nestjs/common'
import { NextFunction, Request, Response } from 'express'
import { OrganizationsService } from '../../common/services/organizations/organizations.service'
import { ORGANIZATION_ID } from '../../common/decorators/organization-id/organization-id.decorator'

export const PUBLIC_ORGANIZATION_ID_PARAM = 'organizationId'

@Injectable()
export class GetPrivateOrganizationIdInterceptor implements NestInterceptor {
  constructor(private readonly organizationsService: OrganizationsService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const req = context.switchToHttp().getRequest()
    const publicOrganizationId = req.params[PUBLIC_ORGANIZATION_ID_PARAM]

    if (publicOrganizationId) {
      const organization = await this.organizationsService.findByPublicId(publicOrganizationId)
      if (organization) {
        req[ORGANIZATION_ID] = organization.id
      } else {
        throw new NotFoundException(`Organization not found`)
      }
    }
    return next.handle()
  }
}
