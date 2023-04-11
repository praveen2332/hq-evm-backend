import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthWallet } from './wallet.entity'
import { AuthEmail } from './email.entity'
import { AuthTwitter } from './twitter.entity'
import { WalletsService } from './wallets.service'
import { EmailService } from './email.service'
import { TwitterService } from './twitter.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthWallet]),
    TypeOrmModule.forFeature([AuthEmail]),
    TypeOrmModule.forFeature([AuthTwitter])
  ],
  providers: [WalletsService, EmailService, TwitterService],
  exports: [TypeOrmModule, WalletsService, EmailService, TwitterService]
})
export class ProvidersEntityModule {}
