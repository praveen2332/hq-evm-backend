import { Module } from '@nestjs/common'
import { FeatureFlagsController } from './feature-flags.controller'
import { FeatureFlagsEntityModule } from '../common/services/feature-flags/feature-flags.entity.module'

@Module({
  imports: [FeatureFlagsEntityModule],
  controllers: [FeatureFlagsController],
  providers: [],
  exports: []
})
export class FeatureFlagsModule {}
