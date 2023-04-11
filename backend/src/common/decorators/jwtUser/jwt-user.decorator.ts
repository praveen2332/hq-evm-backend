import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { JwtPayload } from '../../../auth/interfaces'

export function JwtUserInner(_data: unknown, context: ExecutionContext): null | JwtPayload {
  const request = context.switchToHttp().getRequest()
  return request.user ?? null
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const JwtUser = createParamDecorator(JwtUserInner)
