import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PreprocessRawTask } from './preprocess-raw-task.entity'
import { PreprocessRawTasksService } from './preprocess-raw-tasks.service'

@Module({
  imports: [TypeOrmModule.forFeature([PreprocessRawTask])],
  providers: [PreprocessRawTasksService],
  exports: [TypeOrmModule, PreprocessRawTasksService]
})
export class PreprocessRawTasksEntityModule {}
