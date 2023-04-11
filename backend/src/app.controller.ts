import { Controller, Get } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AppService } from './app.service'
import dataSource from './data-source'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private configService: ConfigService) {
    dataSource.initialize().then((app) => {
      app.runMigrations()
    })
  }

  @Get('/hello')
  async getHello() {
    return this.appService.getHello()
  }
}
