import { ApiConsumes, ApiTags } from '@nestjs/swagger'
import { Controller, Post, Res, Get, Param, UseInterceptors, UploadedFiles } from '@nestjs/common'
import { FilesService } from './files.service'
import { FilesInterceptor } from '@nestjs/platform-express'

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  @Post('')
  async upFile(@UploadedFiles() files: Express.Multer.File[]) {
    const response = await this.filesService.uploadFile(files)
    return response
  }

  @Get(':key')
  async getFile(@Param('key') key: string, @Res() response) {
    return this.filesService.getFile(key, response)
  }
}
