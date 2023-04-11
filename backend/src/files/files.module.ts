import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FilesController } from './files.controller'
import { FilesService } from './files.service'

@Module({
  controllers: [FilesController],
  providers: [FilesService, ConfigService],
  exports: [FilesService]
})
export class FilesModule {}
