import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { InvoicesController } from './invoices.controller'

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [InvoicesController]
})
export class InvoicesModule {}
