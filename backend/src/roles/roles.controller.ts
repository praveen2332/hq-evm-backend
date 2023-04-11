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
import { RolesService } from '../common/services/roles/roles.service'
import { CreateRoleDto, UpdateRoleDto } from './interfaces'
import { PaginationParams, PaginationResponse } from '../core/interfaces'
import { Role } from '../common/services/roles/role.entity'
import { PostgresErrorCode } from '../common/constants'

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get('')
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Query() query: PaginationParams) {
    return this.rolesService.getAllPaging(query, [])
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const role = await this.rolesService.get(id)
    if (role) {
      return role
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiResponse({ status: 200, type: Role })
  async create(@Body(new ValidationPipe()) createRoleDto: CreateRoleDto) {
    try {
      return await this.rolesService.create(createRoleDto)
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('role is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: Role })
  async update(@Body(new ValidationPipe()) updateRoleDto: UpdateRoleDto) {
    try {
      const role = await this.rolesService.get(updateRoleDto.id)
      if (role) {
        role.name = updateRoleDto.name
        role.permissions = updateRoleDto.permissions

        return await this.rolesService.update(role)
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
        throw new BadRequestException('role is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    const role = await this.rolesService.get(id)
    if (role) {
      return this.rolesService.softDelete(id)
    }

    throw new NotFoundException()
  }
}
