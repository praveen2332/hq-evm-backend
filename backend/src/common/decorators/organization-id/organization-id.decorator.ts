import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export const ORGANIZATION_ID = 'organizationId'

export function getPrivateOrganizationId(_data: unknown, context: ExecutionContext): null | string {
  const request = context.switchToHttp().getRequest()
  return request[ORGANIZATION_ID] ?? null
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const OrganizationId = createParamDecorator(getPrivateOrganizationId)
