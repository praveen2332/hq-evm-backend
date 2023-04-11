import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CoreTransformationTask } from './core-transformation-tasks.entity'
import { CoreTransformationTasksService } from './core-transformation-tasks.service'

@Module({
  imports: [TypeOrmModule.forFeature([CoreTransformationTask])],
  providers: [CoreTransformationTasksService],
  exports: [TypeOrmModule, CoreTransformationTasksService]
})
export class CoreTransformationTasksEntityModule {}
