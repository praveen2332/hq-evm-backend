import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../../auth/auth.module'
import { SourceFtx } from './source-ftx.entity'
import { SourceFtxService } from './source-ftx.service'

@Module({
  imports: [TypeOrmModule.forFeature([SourceFtx]), forwardRef(() => AuthModule)],
  providers: [SourceFtxService],
  exports: [TypeOrmModule, SourceFtxService]
})
export class SourceFtxModule {}
