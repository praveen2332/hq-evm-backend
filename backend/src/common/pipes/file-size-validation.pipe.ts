import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common'

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  transform(value: Express.Multer.File[] | Express.Multer.File, metadata: ArgumentMetadata) {
    if (Array.isArray(value)) {
      value.forEach((file) => this.validateFile(file))
    } else {
      this.validateFile(value)
    }
    return value
  }

  validateFile(value: Express.Multer.File) {
    // "value" is an object containing the file's attributes and metadata
    if (!value) {
      throw new BadRequestException('File is required')
    }

    //20mb in bytes
    const twentyMb = 20 * 1000 * 1000

    if (value.size <= twentyMb) {
      return value
    }

    throw new BadRequestException('File is too large')
  }
}
