import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../../auth/auth.module'
import { SourceCoinbase } from './source-coinbase.entity'
import { SourceCoinbaseService } from './source-coinbase.service'

@Module({
  imports: [TypeOrmModule.forFeature([SourceCoinbase]), forwardRef(() => AuthModule)],
  providers: [SourceCoinbaseService],
  exports: [TypeOrmModule, SourceCoinbaseService]
})
export class SourceCoinbaseModule {}
