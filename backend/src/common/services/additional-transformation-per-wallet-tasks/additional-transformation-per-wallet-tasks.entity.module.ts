import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdditionalTransformationPerWalletTask } from './additional-transformation-per-wallet-task.entity'
import { AdditionalTransformationPerWalletTasksService } from './additional-transformation-per-wallet-tasks.service'

@Module({
  imports: [TypeOrmModule.forFeature([AdditionalTransformationPerWalletTask])],
  providers: [AdditionalTransformationPerWalletTasksService],
  exports: [TypeOrmModule, AdditionalTransformationPerWalletTasksService]
})
export class AdditionalTransformationPerWalletTasksEntityModule {}
