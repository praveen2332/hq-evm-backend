import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LoggerModule } from '../common/logger/logger.module'
import { CoingeckoController } from './coingecko.controller'
import { CoingeckoDomainService } from './coingecko.domain.service'

@Module({
  imports: [ConfigModule, HttpModule, LoggerModule],
  providers: [CoingeckoDomainService],
  controllers: [CoingeckoController],
  exports: [CoingeckoDomainService]
})
export class CoingeckoModule {}
