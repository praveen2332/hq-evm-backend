import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator'
import { PaginationParams } from '../core/interfaces'

export class CreateAnalysisDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  url: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  event: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrer?: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userAgent: string

  @ApiProperty()
  @IsNotEmpty()
  payload: any
}

export class AnalysisQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referrer: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional()
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional()
  size?: number

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  order?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  direction?: string
}
