import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Action, Resource } from '../../permissions/interfaces'
import { REQUIRE_PERMISSION_ACTION_KEY, REQUIRE_PERMISSION_RESOURCE_KEY } from '../decorators/permissions.decorator'
import { MembersService } from '../services/members/members.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector, private membersService: MembersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<Resource>(REQUIRE_PERMISSION_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    const action = this.reflector.getAllAndOverride<Action>(REQUIRE_PERMISSION_ACTION_KEY, [
      context.getHandler(),
      context.getClass()
    ])

    if (!(resource && action)) return true

    const { user, params } = context.switchToHttp().getRequest()
    const { accountId } = user

    const findOptions = [{ account: { id: accountId }, organization: { publicId: params.organizationId } }]
    const account = await this.membersService.findOne({
      where: findOptions,
      relations: ['role', 'role.permissions', 'organization']
    })

    const requiredPermission = account?.role?.permissions?.find(
      (permission) => permission.resource === resource && permission.action === action
    )

    return !!requiredPermission
  }
}
