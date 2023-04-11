import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import Decimal from 'decimal.js'
import * as requestIp from 'request-ip'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const config = new DocumentBuilder()
    .setTitle('HQ API')
    .setDescription('HQ API Specification')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  app.setGlobalPrefix('api/v1')
  app.useGlobalFilters(new HttpExceptionFilter())
  app.enableCors()
  app.use(requestIp.mw())
  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  // https://stackoverflow.com/questions/72813558/storing-up-to-78-digits-in-a-relational-database
  Decimal.set({ precision: 78 })
  Decimal.set({ toExpPos: 78 })
  Decimal.set({ toExpNeg: -78 })

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, document)

  await app.listen(process.env.PORT || 3001)
}
bootstrap()
