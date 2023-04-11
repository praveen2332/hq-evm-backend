import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AnalysisController } from './analysis.controller'
import { Analysis } from './analysis.entity'
import { AnalysisService } from './analysis.service'

@Module({
  imports: [TypeOrmModule.forFeature([Analysis])],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [TypeOrmModule, AnalysisService]
})
export class AnalysisModule {}
