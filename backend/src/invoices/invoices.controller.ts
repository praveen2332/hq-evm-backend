import { Body, Controller, Get, Post, Query, ValidationPipe } from '@nestjs/common'
import { map } from 'rxjs'
import { CreateInvoiceDto } from './interface'

@Controller('invoices')
export class InvoicesController {
  @Post()
  simplePrice(@Body(new ValidationPipe()) createInvoiceDto: CreateInvoiceDto) {
    console.log(createInvoiceDto)
  }
}
