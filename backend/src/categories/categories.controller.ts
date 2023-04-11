import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CategoriesQuery, CategoryType, CreateCategoryDto, UpdateCategoryDto } from './interfaces'
import { PaginationParams, PaginationResponse } from '../core/interfaces'
import { PostgresErrorCode } from '../common/constants'
import { CategoriesService } from './categories.service'
import { Category } from './category.entity'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { AccountsService } from '../common/services/account/accounts.service'
import { CategoryPipe } from '../common/pipes/category.pipe'

@ApiTags('categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,
    private organizationsService: OrganizationsService,
    private accountsService: AccountsService
  ) {}

  @Get()
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Param('organizationId') organizationId: string, @Query() query: CategoriesQuery) {
    return this.categoriesService.getCategories(query, organizationId)
  }

  @Get('filter')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getFilterCategories(@Param('organizationId') organizationId: string) {
    const categories = await this.categoriesService.find({ where: { organization: { publicId: organizationId } } })
    const filter = {}
    const types = Object.keys(CategoryType)
    for (const type of types) {
      filter[CategoryType[type]] = categories
        .filter((category) => category.type === CategoryType[type])
        .map((category) => category.name)
        .sort()
    }
    return filter
  }

  @Post('replace')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async replaceAll(
    @Param('organizationId') organizationId: string,
    @Body(new ValidationPipe()) replaceCategoryDto: CreateCategoryDto[],
    @Req() req
  ) {
    try {
      const organization = await this.organizationsService.findByPublicId(organizationId)
      await this.categoriesService.deleteAllCategory(organization.id)
      const account = await this.accountsService.get(req.user.accountId)
      for (const category of replaceCategoryDto) {
        const newCategory = new Category()
        newCategory.type = category.type
        newCategory.name = category.name
        newCategory.code = category.code
        newCategory.description = category.description

        newCategory.createdBy = account
        newCategory.organization = organization
        await this.categoriesService.create(newCategory)
      }
      return true
    } catch (error) {
      throw new NotFoundException()
    }
  }

  @Get(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async get(@Param('organizationId') organizationId: string, @Param('id') id: string) {
    const category = await this.categoriesService.findOne({
      where: { id: id, organization: { publicId: organizationId } },
      relations: ['organization', 'createdBy']
    })
    if (category) {
      return category
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Category })
  async create(
    @Param('organizationId') organizationId: string,
    @Body(new ValidationPipe()) createCategoryDto: CreateCategoryDto,
    @Req() req
  ) {
    const { accountId } = req.user
    const record = await this.categoriesService.findOne({
      where: { name: createCategoryDto.name, organization: { publicId: organizationId } }
    })

    if (record) {
      throw new BadRequestException('Category name is already existed')
    }

    try {
      const account = await this.accountsService.get(accountId)
      const organization = await this.organizationsService.findByPublicId(organizationId)

      const category = new Category()
      category.type = createCategoryDto.type
      category.name = createCategoryDto.name
      category.code = createCategoryDto.code
      category.description = createCategoryDto.description

      category.createdBy = account
      category.organization = organization

      return await this.categoriesService.create(category)
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('Code is already existed')
      }
      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Category })
  async update(
    @Param('organizationId') organizationId: string,
    @Param('id') id: string,
    @Body(new ValidationPipe()) updateCategoryDto: CreateCategoryDto
  ) {
    const recordByName = await this.categoriesService.findOne({
      where: { name: updateCategoryDto.name, organization: { publicId: organizationId } }
    })
    if (recordByName && recordByName.id !== id) {
      throw new BadRequestException('Category name is already existed')
    }

    try {
      const category = await this.categoriesService.findOne({
        where: { id, organization: { publicId: organizationId } }
      })

      if (category) {
        category.name = updateCategoryDto.name
        category.code = updateCategoryDto.code
        category.type = updateCategoryDto.type
        category.description = updateCategoryDto.description
        return await this.categoriesService.update(category)
      }

      throw new NotFoundException()
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw new NotFoundException()
      }

      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('Code is already existed')
      }

      throw new InternalServerErrorException()
    }
  }

  @Delete(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async delete(@Param('organizationId') organizationId: string, @Param('id', new CategoryPipe()) id: string) {
    const category = await this.categoriesService.findOne({
      where: { id, organization: { publicId: organizationId } }
    })
    if (category) {
      return this.categoriesService.softDelete(id)
    }
    throw new NotFoundException()
  }
}
