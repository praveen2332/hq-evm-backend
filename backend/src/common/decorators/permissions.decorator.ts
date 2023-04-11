import { SetMetadata } from '@nestjs/common'
import { Action, Resource } from '../../permissions/interfaces'

export const REQUIRE_PERMISSION_RESOURCE_KEY = 'require_permission_resource'
export const RequirePermissionResource = (resource: Resource) => SetMetadata(REQUIRE_PERMISSION_RESOURCE_KEY, resource)

export const REQUIRE_PERMISSION_ACTION_KEY = 'require_permission_action'
export const RequirePermissionAction = (action: Action) => SetMetadata(REQUIRE_PERMISSION_ACTION_KEY, action)
