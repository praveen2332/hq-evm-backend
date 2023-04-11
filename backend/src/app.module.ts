import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { RouterModule } from '@nestjs/core'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'
import { TypeOrmModule } from '@nestjs/typeorm'
import * as Joi from 'joi'
import { AccountsModule } from './accounts/accounts.module'
import { AnalysisController } from './analysis/analysis.controller'
import { AnalysisModule } from './analysis/analysis.module'
import { AnalysisService } from './analysis/analysis.service'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AssetsModule } from './assets/assets.module'
import { AuthModule } from './auth/auth.module'
import { BlockchainsModule } from './blockchains/blockchains.module'
import { CategoriesModule } from './categories/categories.module'
import { ChainsModule } from './chains/chains.module'
import { CoingeckoModule } from './coingecko/coingecko.module'
import { ContactsModule } from './contacts/contacts.module'
import { CoreModule } from './core/core.module'
import { PUBLIC_ORGANIZATION_ID_PARAM } from './core/interceptors/get-private-organization-id.interceptor'
import { CountriesModule } from './countries/countries.module'
import { CryptocurrenciesModule } from './cryptocurrencies/cryptocurrencies.module'
import { CryptocurrenciesPublicModule } from './cryptocurrencies/public/cryptocurrencies-public.module'
import { FeatureFlagsModule } from './feature-flags/feature-flags.module'
import { FiatCurrenciesModule } from './fiat-currencies/fiat-currencies.module'
import { FilesModule } from './files/files.module'
import { FinancialTransactionsModule } from './financial-transactions/financial-transactions.module'
import { FinancialTransformationsModule } from './financial-transformations/financial-transformations.module'
import { GroupsModule } from './groups/groups.module'
import { HealthModule } from './health/health.module'
import { InvitationsModule } from './invitations/invitations.module'
import { InvitationsPublicModule } from './invitations/public/invitations-public.module'
import { MembersModule } from './members/members.module'
import { MigrateTxDataModule } from './migrate-tx-data/migrate-tx-data.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { PaymentLinkMetadataModule } from './payment-link-metadata/payment-link-metadata.module'
import { PaymentLinksModule } from './payment-links/payment-links.module'
import { PricesModule } from './prices/prices.module'
import { ProvidersModule } from './providers/providers.module'
import { RecipientsModule } from './recipients/recipients.module'
import { RolesModule } from './roles/roles.module'
import { SchedulesModule } from './schedules/schedules.module'
import { SettingsModule } from './setting/settings.module'
import { SourceOfFundsModule } from './source-of-funds/source-of-funds.module'
import { TimezonesModule } from './timezones/timezones.module'
import { TokensModule } from './tokens/tokens.module'
import { TransactionsModule } from './transactions/transactions.module'
import { WalletGroupsModule } from './wallet-groups/wallet-groups.module'
import { WalletsModule } from './wallets/wallets.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        DATABASE_URL: Joi.required(),
        DATABASE_LOGGING: Joi.required(),
        DATABASE_ENTITIES: Joi.required(),
        DATABASE_MIGRATIONS: Joi.required(),
        DATABASE_MIGRATIONS_TABLE_NAME: Joi.required(),
        COINGECKO_API_KEY: Joi.required(),
        ETHERSCAN_API_KEY: Joi.required(),
        ALCHEMY_INGESTION_API_KEY: Joi.required(),
        POLYGONSCAN_API_KEY: Joi.required(),
        BSCSCAN_API_KEY: Joi.required(),
        AWS_S3_BUCKET: Joi.required(),
        AWS_S3_KEY_SECRET: Joi.required(),
        AWS_S3_ACCESS_KEY: Joi.required(),
        AWS_S3_REGION: Joi.required(),
        S3_URL: Joi.required(),
        VAULT_ROLE_ID: Joi.required(),
        VAULT_SECRET_ID: Joi.required(),
        VAULT_NAMESPACE: Joi.required(),
        VAULT_ENV: Joi.required()
      })
    }),
    HttpModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLE_TTL') || 60,
        limit: configService.get('THROTTLE_LIMIT') || 10000
      })
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        logging: configService.get('DATABASE_LOGGING'),
        entities: [configService.get('DATABASE_ENTITIES')],
        migrations: [configService.get('DATABASE_MIGRATIONS')],
        migrationsTableName: configService.get('DATABASE_MIGRATIONS_TABLE_NAME')
      })
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    CoreModule,
    AccountsModule,
    OrganizationsModule,
    AuthModule,
    TransactionsModule,
    TokensModule,
    ChainsModule,
    RolesModule,
    FilesModule,
    HealthModule,
    GroupsModule,
    SourceOfFundsModule,
    RecipientsModule,
    InvitationsPublicModule,
    PricesModule,
    CoingeckoModule,
    SchedulesModule,
    CategoriesModule,
    InvitationsModule,
    ProvidersModule,
    MembersModule,
    PaymentLinksModule,
    ContactsModule,
    FinancialTransactionsModule,
    PaymentLinkMetadataModule,
    WalletGroupsModule,
    WalletsModule,
    AssetsModule,
    CryptocurrenciesModule,
    CryptocurrenciesPublicModule,
    SettingsModule,
    CountriesModule,
    TimezonesModule,
    MigrateTxDataModule,
    FeatureFlagsModule,
    BlockchainsModule,
    RouterModule.register([
      {
        path: `:${PUBLIC_ORGANIZATION_ID_PARAM}`,
        children: [
          {
            path: '/groups',
            module: GroupsModule
          },
          {
            path: '/source-of-funds',
            module: SourceOfFundsModule
          },
          {
            path: '/wallet-groups',
            module: WalletGroupsModule
          },
          {
            path: '/wallets',
            module: WalletsModule
          },
          {
            path: '/recipients',
            module: RecipientsModule
          },
          {
            path: '/transactions',
            module: TransactionsModule
          },
          {
            path: '/categories',
            module: CategoriesModule
          },
          {
            path: '/members',
            module: MembersModule
          },
          {
            path: '/invitations',
            module: InvitationsModule
          },
          {
            path: '/payment-links',
            module: PaymentLinksModule
          },
          {
            path: '/contacts',
            module: ContactsModule
          },
          {
            path: '/financial-transactions',
            module: FinancialTransactionsModule
          },
          {
            path: '/assets',
            module: AssetsModule
          },
          {
            path: '/cryptocurrencies',
            module: CryptocurrenciesModule
          },
          {
            path: '/setting',
            module: SettingsModule
          }
        ]
      },
      {
        path: '',
        children: [
          {
            path: '/fiat-currencies',
            module: FiatCurrenciesModule
          },
          {
            path: '/countries',
            module: CountriesModule
          },
          {
            path: '/timezones',
            module: TimezonesModule
          },
          {
            path: '/migrate-tx-data',
            module: MigrateTxDataModule
          },
          {
            path: '/feature-flags',
            module: FeatureFlagsModule
          },
          {
            path: '/blockchains',
            module: BlockchainsModule
          }
        ]
      }
    ]),
    AnalysisModule,
    FiatCurrenciesModule,
    FinancialTransformationsModule
  ],
  controllers: [AppController, AnalysisController],
  providers: [AppService, AnalysisService]
})
export class AppModule {}
