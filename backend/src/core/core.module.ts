import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { LoggingInterceptor } from './interceptors/logging.interceptor'
import { TransformInterceptor } from './interceptors/transform.interceptor'
import { GetPrivateOrganizationIdInterceptor } from './interceptors/get-private-organization-id.interceptor'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'

@Module({
  imports: [OrganizationsEntityModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: GetPrivateOrganizationIdInterceptor }
  ]
})
export class CoreModule {}
