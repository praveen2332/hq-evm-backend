import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../../auth/auth.module'
import { SourceGnosis } from './source-gnosis.entity'
import { SourceGnosisService } from './source-gnosis.service'

@Module({
  imports: [TypeOrmModule.forFeature([SourceGnosis]), forwardRef(() => AuthModule)],
  providers: [SourceGnosisService],
  exports: [TypeOrmModule, SourceGnosisService]
})
export class SourceGnosisModule {}
