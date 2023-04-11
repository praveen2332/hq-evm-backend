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
import { CreateTokenDto, UpdateTokenDto } from './interfaces'
import { PaginationParams, PaginationResponse } from '../core/interfaces'
import { PostgresErrorCode } from '../common/constants'
import { TokensService } from '../common/services/tokens/tokens.service'
import { Token } from '../common/services/tokens/token.entity'

@ApiTags('tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tokens')
export class TokensController {
  constructor(private tokensService: TokensService) {}

  @Get('')
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Query() query: PaginationParams) {
    const res = await this.tokensService.getAllPaging(query, ['name'], {}, ['chains'])
    res.items = res.items.map((item: any) => {
      switch (item.name) {
        case 'USDT':
          item.order = 2
          break
        case 'DAI':
          item.order = 3
          break
        case 'USDC':
          item.order = 1
          break
        case 'XSGD':
          item.order = 5
          break
        case 'XIDR':
          item.order = 6
          break
        case 'ETH':
          item.order = 4
          break
        case 'MATIC':
          item.order = 5
          break
      }
      return item
    })
    res.items.sort((a: any, b: any) => a.order - b.order)
    return res
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const token = await this.tokensService.get(id)
    if (token) {
      return token
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiResponse({ status: 200, type: Token })
  async create(@Body(new ValidationPipe()) CreateTokenDto: CreateTokenDto) {
    try {
      return await this.tokensService.create(CreateTokenDto)
    } catch (error) {
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('Token is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: Token })
  async update(@Body(new ValidationPipe()) updateTokenDto: UpdateTokenDto) {
    try {
      const token = await this.tokensService.get(updateTokenDto.id)
      if (token) {
        token.name = updateTokenDto.name

        return await this.tokensService.update(token)
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
        throw new BadRequestException('token is already exist')
      }

      throw new InternalServerErrorException()
    }
  }

  @Delete(':id')
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    const token = await this.tokensService.get(id)
    if (token) {
      return this.tokensService.softDelete(id)
    }

    throw new NotFoundException()
  }
}
