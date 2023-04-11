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
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { GroupsService } from './groups.service'
import { CreateGroupDto, UpdateGroupDto } from './interfaces'
import { PaginationParams, PaginationResponse } from '../core/interfaces'
import { Group } from './group.entity'
import { PostgresErrorCode } from '../common/constants'

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Query() query: PaginationParams, @Param('organizationId') organizationId: string) {
    return this.groupsService.getAllPaging(
      query,
      ['name', 'description'],
      {
        organization: {
          publicId: organizationId
        }
      },
      ['accounts']
    )
  }

  @Get(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async get(@Param('id') id: string) {
    const group = await this.groupsService.findByPublicId(id)
    if (group) {
      return group
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Group })
  async create(@Body(new ValidationPipe()) createGroupDto: CreateGroupDto, @Param() param) {
    createGroupDto.organizationId = param.organizationId
    try {
      return await this.groupsService.create(createGroupDto)
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('group is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Group })
  async update(@Body(new ValidationPipe()) updateGroupDto: UpdateGroupDto, @Param('id') id: string) {
    try {
      const group = await this.groupsService.findByPublicId(id)
      if (group) {
        group.name = updateGroupDto.name
        group.description = updateGroupDto.description

        return await this.groupsService.update(group)
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
        throw new BadRequestException('group is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Delete(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    const group = await this.groupsService.findByPublicId(id)
    if (group) {
      return this.groupsService.softDelete(group.id)
    }

    throw new NotFoundException()
  }
}
