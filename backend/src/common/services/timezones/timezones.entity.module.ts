import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TimezonesService } from './timezones.service'
import { Timezone } from './timezone.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Timezone])],
  controllers: [],
  providers: [TimezonesService],
  exports: [TypeOrmModule, TimezonesService]
})
export class TimezonesEntityModule {}
