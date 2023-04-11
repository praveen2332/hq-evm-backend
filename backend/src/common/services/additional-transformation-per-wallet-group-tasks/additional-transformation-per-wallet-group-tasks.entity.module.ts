import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdditionalTransformationPerWalletGroupTask } from './additional-transformation-per-wallet-group-task.entity'
import { AdditionalTransformationPerWalletGroupTasksService } from './additional-transformation-per-wallet-group-tasks.service'

@Module({
  imports: [TypeOrmModule.forFeature([AdditionalTransformationPerWalletGroupTask])],
  providers: [AdditionalTransformationPerWalletGroupTasksService],
  exports: [TypeOrmModule, AdditionalTransformationPerWalletGroupTasksService]
})
export class AdditionalTransformationPerWalletGroupTasksEntityModule {}
