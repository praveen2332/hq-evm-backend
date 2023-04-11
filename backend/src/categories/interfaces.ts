import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { PaginationParams } from '../core/interfaces'
import { Category } from './category.entity'

export enum CategoryType {
  REVENUE = 'Revenue',
  EXPENSE = 'Expense',
  DIRECT_COSTS = 'Direct Costs',
  EQUITY = 'Equity'
}
export class CreateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNotEmpty()
  type: CategoryType

  @ApiProperty()
  @IsNotEmpty()
  code: string

  @ApiPropertyOptional()
  @IsOptional()
  description: string

  static map(category: Category): CreateCategoryDto {
    const categoryDto = new CreateCategoryDto()
    categoryDto.name = category.name
    categoryDto.type = category.type
    categoryDto.code = category.code
    categoryDto.description = category.description
    return categoryDto
  }
}

export class CategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  id: string

  @ApiProperty()
  @IsNotEmpty()
  name: string

  @ApiProperty()
  @IsNotEmpty()
  type: CategoryType

  @ApiProperty()
  @IsNotEmpty()
  code: string

  @ApiPropertyOptional()
  @IsOptional()
  description: string

  static map(category: Category): CategoryDto {
    const categoryDto = new CategoryDto()
    categoryDto.name = category.name
    categoryDto.id = category.publicId
    categoryDto.type = category.type
    categoryDto.code = category.code
    categoryDto.description = category.description
    return categoryDto
  }
}

export class UpdateCategoryDto {
  @ApiProperty()
  @IsNotEmpty()
  name: string
}

export class CategoriesQuery extends PaginationParams {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type: string
}
