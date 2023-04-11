import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { IngestionTask } from './ingestion-task.entity'
import { IngestionTaskService } from './ingestion-task.service'

@Module({
  imports: [TypeOrmModule.forFeature([IngestionTask])],
  controllers: [],
  providers: [IngestionTaskService],
  exports: [TypeOrmModule, IngestionTaskService]
})
export class IngestionTaskEntityModule {}
