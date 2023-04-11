import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { OrganizationsModule } from '../src/organizations/organizations.module'
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../src/auth/auth.module'
import { Organization } from '../src/common/services/organizations/organization.entity'
import { OrganizationsController } from '../src/organizations/organizations.controller'
import { OrganizationsService } from '../src/common/services/organizations/organizations.service'
import { Connection, Repository } from 'typeorm'
import { getConnection } from './db'
import { auth } from './utils'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { CoreModule } from '../src/core/core.module'

describe('RecipientsController (e2e)', () => {
  let app: INestApplication
  let connection: Connection
  let configService: ConfigService
  let token: string

  beforeEach(async () => {
    connection = await getConnection([Organization])
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        OrganizationsModule,
        CoreModule,
        AuthModule,
        TypeOrmModule.forRoot({
          type: 'postgres',
          entities: [Organization]
        })
      ],
      controllers: [OrganizationsController],
      providers: [ConfigService, OrganizationsService]
    })
      .overrideProvider(Connection)
      .useValue(connection)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()
    configService = app.get(ConfigService)
    token = await auth(app, configService.get('MNEMONIC'))
  })

  afterEach(() => {
    return connection.close()
  })

  it('/organization (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/organization/me').set('Authorization', `Bearer ${token}`)
    console.log(res.body)
  })
})
