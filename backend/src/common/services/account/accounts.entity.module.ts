import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from './account.entity'
import { AccountsService } from './accounts.service'

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountsService],
  exports: [TypeOrmModule, AccountsService]
})
export class AccountsEntityModule {}
