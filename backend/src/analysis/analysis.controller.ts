import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  ValidationPipe
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { Request } from 'express'
import { Analysis } from './analysis.entity'
import { AnalysisService } from './analysis.service'
import { AnalysisQuery, CreateAnalysisDto } from './interface'
import { PaginationResponse } from '../core/interfaces'

@ApiTags('analysis')
@Controller('analysis')
export class AnalysisController {
  constructor(private analysisService: AnalysisService) {}

  @Get()
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Query() query: AnalysisQuery) {
    const analysis = await this.analysisService.getAllAnalysis(query)
    if (analysis) {
      return analysis
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiResponse({ status: 200, type: Analysis })
  async create(@Body(new ValidationPipe()) createAnalysisDto: CreateAnalysisDto, @Req() req: Request) {
    try {
      const analysis = new Analysis()
      analysis.url = createAnalysisDto.url
      analysis.event = createAnalysisDto.event
      analysis.referrer = createAnalysisDto.referrer
      analysis.sourceIp = req.ip
      analysis.timestamp = new Date()
      analysis.userAgent = createAnalysisDto.userAgent
      analysis.payload = createAnalysisDto.payload

      return await this.analysisService.create(analysis)
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }
}
