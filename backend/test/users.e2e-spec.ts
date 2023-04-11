// import { Test, TestingModule } from '@nestjs/testing'
// import { INestApplication } from '@nestjs/common'
// import * as request from 'supertest'
// import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm'
// import { AuthModule } from '../src/auth/auth.module'
// import { Organization } from '../src/organizations/organization.entity'
// import { Team } from '../src/teams/team.entity'
// import { TeamsModule } from '../src/teams/teams.module'
// import { Account } from '../src/accounts/account.entity'
// import { OrganizationsController } from '../src/organizations/organizations.controller'
// import { OrganizationsService } from '../src/organizations/organizations.service'
// import { TeamsService } from '../src/teams/teams.service'
// import { Connection, Repository } from 'typeorm'
// import { getConnection } from './db'
// import { UsersModule } from '../src/accounts/accounts.module'
// import { CoreModule } from '../src/core/core.module'

// describe('RecipientsController (e2e)', () => {
//   let app: INestApplication
//   let connection: Connection
//   const address = '0x36De3d08157b8Ed6C0eCc45553d0fE918d49e959'

//   beforeEach(async () => {
//     connection = await getConnection([Organization, Team, Account])
//     const moduleFixture: TestingModule = await Test.createTestingModule({
//       imports: [
//         CoreModule,
//         UsersModule,
//         TeamsModule,
//         AuthModule,
//         TypeOrmModule.forRoot({
//           type: 'postgres',
//           entities: [Organization, Team, Account]
//         })
//       ],
//       controllers: [OrganizationsController],
//       providers: [
//         OrganizationsService,
//         TeamsService,
//         { provide: getRepositoryToken(Organization), useClass: Repository },
//         { provide: getRepositoryToken(Team), useClass: Repository }
//       ]
//     })
//       .overrideProvider(Connection)
//       .useValue(connection)
//       .compile()

//     app = moduleFixture.createNestApplication()
//     await app.init()
//   })

//   it('/ (GET)', async () => {
//     const res = await request(app.getHttpServer()).get(`/user/${address}`).expect(200)
//     expect(res.body.data).toMatchObject({ address })
//   })
// })
