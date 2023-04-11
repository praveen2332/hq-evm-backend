import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { NO_AUTH } from '../common/decorators/no-auth.decorator'
import { Reflector } from '@nestjs/core'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }
  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    const noAuth = this.reflector.get<boolean>(NO_AUTH, context.getHandler())
    if (noAuth) {
      return true
    }

    return super.canActivate(context)
  }

  handleRequest(err, wallet, info) {
    // You can throw an exception based on either "info" or "err" arguments
    if (info && info.name === 'TokenExpiredError') {
      throw new UnauthorizedException(info.message)
    }

    if (err || !wallet) {
      throw err || new UnauthorizedException()
    }
    return wallet
  }
}
