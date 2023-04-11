import { Body, Controller, InternalServerErrorException, Post, ValidationPipe } from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { CreatePaymentLinkMetadataDto } from './interfaces'
import { LoggerService } from '../common/logger/logger.service'
import { PaymentLinkMetadataService } from './payment-link-metadata.service'
import { PaymentLinkMetadata } from './payment-link-metadata.entity'

@ApiTags('payment-link-metadata')
@Controller('payment-link-metadata')
export class PaymentLinkMetadataController {
  constructor(private paymentLinkMetadataService: PaymentLinkMetadataService, private readonly logger: LoggerService) {}

  @Post()
  @ApiResponse({ status: 200 })
  async create(@Body(new ValidationPipe()) paymentLinkMetadataDto: CreatePaymentLinkMetadataDto) {
    try {
      const paymentLinkMetadata = PaymentLinkMetadata.create(paymentLinkMetadataDto)
      await this.paymentLinkMetadataService.create(paymentLinkMetadata)
      return { success: true }
    } catch (error) {
      this.logger.error(`Can not create payment link metadata: ${error.message}`, { error }, { paymentLinkMetadataDto })
      throw new InternalServerErrorException()
    }
  }
}
