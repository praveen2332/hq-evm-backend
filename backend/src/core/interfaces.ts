import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

export enum Direction {
  ASC = 'ASC',
  DESC = 'DESC'
}
export class PaginationParams {
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
  @IsEnum(Direction)
  @ApiPropertyOptional({ enum: Direction, default: Direction.DESC })
  direction?: Direction = Direction.DESC

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string

  // @IsOptional()
  // @IsString()
  // @ApiPropertyOptional()
  // group?: string
}

export class PaginationResponse<T> {
  @ApiProperty()
  totalItems: number

  @ApiProperty()
  totalPages: number

  @ApiProperty()
  currentPage: number

  @ApiProperty()
  limit: number

  @ApiProperty({ isArray: true })
  items: T[]

  static from<T>(params: {
    items: T[]
    totalItems: number
    currentPage: number
    limit: number
  }): PaginationResponse<T> {
    const response = new PaginationResponse<T>()
    response.items = params.items
    response.totalItems = params.totalItems
    response.totalPages = Math.ceil(params.totalItems / params.limit)
    response.currentPage = params.currentPage
    response.limit = params.limit
    return response
  }
}
