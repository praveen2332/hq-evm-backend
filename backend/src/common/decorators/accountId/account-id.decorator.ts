import { createParamDecorator, ExecutionContext } from '@nestjs/common'

export function accountIdInner(_data: unknown, context: ExecutionContext): null | string {
  const request = context.switchToHttp().getRequest()
  return request.user?.accountId ?? null
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AccountId = createParamDecorator(accountIdInner)
