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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateChainDto, UpdateChainDto } from './interfaces'
import { PaginationParams, PaginationResponse } from '../core/interfaces'
import { PostgresErrorCode } from '../common/constants'
import { ChainsService } from '../common/services/chains/chains.service'
import { Chain } from '../common/services/chains/chain.entity'

@ApiTags('chains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chains')
export class ChainsController {
  constructor(private chainsService: ChainsService) {}

  @Get('')
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Query() query: PaginationParams) {
    return this.chainsService.getAllPaging(query, ['name'], {}, ['tokens'])
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const chain = await this.chainsService.get(id, { relations: ['tokens'] })
    if (chain) {
      return chain
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiResponse({ status: 200, type: Chain })
  async create(@Body(new ValidationPipe()) createChainDto: CreateChainDto) {
    try {
      return await this.chainsService.create(createChainDto)
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('Chain is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: Chain })
  async update(@Body(new ValidationPipe()) updateChainDto: UpdateChainDto) {
    try {
      const chain = await this.chainsService.get(updateChainDto.id)
      if (chain) {
        chain.name = updateChainDto.name
        chain.isTestnet = updateChainDto.isTestNet

        return await this.chainsService.update(chain)
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
        throw new BadRequestException('chain is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    const chain = await this.chainsService.get(id)
    if (chain) {
      return this.chainsService.softDelete(id)
    }

    throw new NotFoundException()
  }
}
