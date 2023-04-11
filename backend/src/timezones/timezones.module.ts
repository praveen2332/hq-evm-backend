import { Module } from '@nestjs/common'
import { TimezonesController } from './timezones.controller'
import { TimezonesEntityModule } from '../common/services/timezones/timezones.entity.module'

@Module({
  imports: [TimezonesEntityModule],
  controllers: [TimezonesController],
  providers: [],
  exports: []
})
export class TimezonesModule {}
