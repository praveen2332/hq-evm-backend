import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../../auth/auth.module'
import { SourceCdc } from './source-cdc.entity'
import { SourceCdcService } from './source-cdc.service'

@Module({
  imports: [TypeOrmModule.forFeature([SourceCdc]), forwardRef(() => AuthModule)],
  providers: [SourceCdcService],
  exports: [TypeOrmModule, SourceCdcService]
})
export class SourceCdcModule {}
