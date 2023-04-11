import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'

config()

const configService = new ConfigService()

const dataSource = new DataSource({
  type: 'postgres',
  url: configService.get('DATABASE_URL'),
  logging: configService.get('DATABASE_LOGGING'),
  entities: [configService.get('DATABASE_ENTITIES')],
  migrations: [configService.get('DATABASE_MIGRATIONS')],
  migrationsTableName: configService.get('DATABASE_MIGRATIONS_TABLE_NAME')
})

export default dataSource
