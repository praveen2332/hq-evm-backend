import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { LoggerModule } from '../common/logger/logger.module'
import { CryptocurrenciesEntityModule } from '../common/services/cryptocurrencies/cryptocurrencies.entity.module'
import { MembersEntityModule } from '../common/services/members/members.entity.module'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { PaymentLinkEntityModule } from '../common/services/payment-links/payment-link.entity.module'
import { PaymentLinkDomainService } from './payment-link.domain.service'
import { PaymentLinksController } from './payment-links.controller'

@Module({
  imports: [
    PaymentLinkEntityModule,
    OrganizationsEntityModule,
    LoggerModule,
    AuthModule,
    CryptocurrenciesEntityModule,
    MembersEntityModule
  ],
  controllers: [PaymentLinksController],
  providers: [PaymentLinkDomainService],
  exports: []
})
export class PaymentLinksModule {}
