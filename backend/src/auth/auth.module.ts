import { forwardRef, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AccountsModule } from '../accounts/accounts.module'
import { LoggerModule } from '../common/logger/logger.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { ProvidersEntityModule } from '../common/services/providers/providers.entity.module'
import { OrganizationsModule } from '../organizations/organizations.module'
import { RolesModule } from '../roles/roles.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { jwtConstants } from './constants'
import { ConfigModule } from '@nestjs/config'
import { JwtAuthGuard } from './jwt-auth.guard'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    ConfigModule,
    OrganizationsModule,
    LoggerModule,
    PassportModule,
    RolesModule,
    AccountsEntityModule,
    ProvidersEntityModule,
    MembersEntityModule,
    forwardRef(() => AccountsModule),
    JwtModule.register({
      secret: jwtConstants.secret
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  exports: [AuthService]
})
export class AuthModule {}
