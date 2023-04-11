import { BadRequestException, Injectable, Res } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { S3 } from 'aws-sdk'
import { v4 as uuidv4 } from 'uuid'
import { BucketSelector } from './interfaces'
import { PutObjectRequest } from 'aws-sdk/clients/s3'

@Injectable()
export class FilesService {
  AWS_S3_BUCKET: string
  PUBLIC_AWS_S3_BUCKET: string
  PRIVATE_AWS_S3_BUCKET: string
  AWS_S3_ACCESS_KEY: string
  AWS_S3_KEY_SECRET: string
  AWS_S3_REGION: string
  S3_URL: string
  s3: S3

  constructor(private readonly configService: ConfigService) {
    this.AWS_S3_BUCKET = this.configService.get('AWS_S3_BUCKET')
    this.PUBLIC_AWS_S3_BUCKET = this.configService.get('PUBLIC_AWS_S3_BUCKET')
    this.PRIVATE_AWS_S3_BUCKET = this.configService.get('PRIVATE_AWS_S3_BUCKET')
    this.AWS_S3_ACCESS_KEY = this.configService.get('AWS_S3_ACCESS_KEY')
    this.AWS_S3_KEY_SECRET = this.configService.get('AWS_S3_KEY_SECRET')
    this.AWS_S3_REGION = this.configService.get('AWS_S3_REGION')
    this.S3_URL = this.configService.get('S3_URL')
    this.s3 = new S3({
      accessKeyId: this.AWS_S3_ACCESS_KEY,
      secretAccessKey: this.AWS_S3_KEY_SECRET,
      region: this.AWS_S3_REGION
    })
  }

  async uploadToS3(buffer: Buffer, path: string, bucketSelector: BucketSelector, contentType?: string) {
    let bucket = null
    if (bucketSelector === BucketSelector.PUBLIC) {
      bucket = this.PUBLIC_AWS_S3_BUCKET
    } else {
      bucket = this.PRIVATE_AWS_S3_BUCKET
    }

    const params: PutObjectRequest = {
      Bucket: bucket,
      Body: buffer,
      Key: path,
      ContentType: contentType ?? undefined
    }

    try {
      const uploadResult = await this.s3.upload(params).promise()
      return uploadResult.Location
    } catch (error) {
      console.log(error)
    }
  }

  getFileStreamFromS3(fileKey: string, bucketSelector: BucketSelector) {
    let bucket = null
    if (bucketSelector === BucketSelector.PUBLIC) {
      bucket = this.PUBLIC_AWS_S3_BUCKET
    } else {
      bucket = this.PRIVATE_AWS_S3_BUCKET
    }

    const params = {
      Key: fileKey,
      Bucket: bucket
    }

    return this.s3.getObject(params).createReadStream()
  }

  async uploadFile(files: Express.Multer.File[]) {
    const length = files.length
    const fileKey: string[] = []
    try {
      for (let i = 0; i < length; i++) {
        const uploadResult = await this.s3
          .upload({
            Bucket: this.AWS_S3_BUCKET,
            Body: files[i].buffer,
            Key: `${uuidv4()}-${files[i].originalname}`
          })
          .promise()
        fileKey.push(uploadResult.Key)
      }
      return fileKey
    } catch (error) {
      console.log(error)
      throw new BadRequestException('Failed to upload files')
    }
  }

  async getFile(key: string, @Res() res) {
    try {
      const stream = this.getFileStream(key)
      stream.pipe(res)
    } catch (error) {
      return res.status(500).json(`Failed to upload file: ${error}`)
    }
  }

  getFileStream(fileKey) {
    return this.getFileS3Response(fileKey).createReadStream()
  }
  getFileS3Response(fileKey) {
    const params = {
      Key: fileKey,
      Bucket: this.AWS_S3_BUCKET
    }

    return this.s3.getObject(params)
  }

  async uploadTransactionAttachment(file: Express.Multer.File, param: { organizationId: string; childId: string }) {
    const key = this.getPathToTransactionAttachment(param)
    const filePath = await this.uploadToS3(file.buffer, key, BucketSelector.PRIVATE, file.mimetype)
    return {
      key,
      filePath
    }
  }
  getTransactionAttachmentStream(fileKey: string) {
    return this.getFileStreamFromS3(fileKey, BucketSelector.PRIVATE)
  }

  getPathToTransactionAttachment(param: { organizationId: string; childId: string }) {
    return `organizations/files/${param.organizationId}/financial_transaction_children/${param.childId}/${uuidv4()}`
  }
}
