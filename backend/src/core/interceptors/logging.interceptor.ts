import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    this.logger.log(`Request: ${context.switchToHttp().getRequest().url}`)

    const now = Date.now()
    return next
      .handle()
      .pipe(tap(() => this.logger.log(`Response ${context.switchToHttp().getRequest().url}: ${Date.now() - now}ms`)))
  }
}
