import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { LoggerModule } from '../../logger/logger.module'
import { FeatureFlag } from './feature-flag.entity'
import { FeatureFlagsService } from './feature-flags.service'

@Module({
  imports: [TypeOrmModule.forFeature([FeatureFlag]), LoggerModule],
  providers: [FeatureFlagsService],
  exports: [TypeOrmModule, FeatureFlagsService]
})
export class FeatureFlagsEntityModule {}
