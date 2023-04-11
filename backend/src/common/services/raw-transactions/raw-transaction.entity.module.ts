import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RawTransaction } from './raw-transaction.entity'
import { RawTransactionService } from './raw-transaction.service'
import { LoggerModule } from '../../logger/logger.module'

@Module({
  imports: [TypeOrmModule.forFeature([RawTransaction]), LoggerModule],
  controllers: [],
  providers: [RawTransactionService],
  exports: [TypeOrmModule, RawTransactionService]
})
export class RawTransactionEntityModule {}
