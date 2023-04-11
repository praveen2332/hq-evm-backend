import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, Repository } from 'typeorm'
import { BaseService } from '../core/base.service'
import { PaginationResponse } from '../core/interfaces'
import { Analysis } from './analysis.entity'
import { AnalysisQuery } from './interface'

@Injectable()
export class AnalysisService extends BaseService<Analysis> {
  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>
  ) {
    super(analysisRepository)
  }

  async getAllAnalysis(options: AnalysisQuery): Promise<PaginationResponse<Analysis>> {
    let query = ''
    const page = options.page || 0
    const size = options.size || 10
    const ip = (options.ip || '').trim()
    const order = options.order || 'updatedAt'
    const event = (options.event || '').trim()
    const referrer = (options.referrer || '').trim()
    const direction = (options.direction || 'DESC') as 'DESC' | 'ASC'

    if (ip) {
      query = `${query ? 'AND' : ''} analysis.source_ip ILIKE :ip`
    }

    if (referrer) {
      query = `${query ? 'AND' : ''} analysis.referrer ILIKE :referrer`
    }

    if (event) {
      query = `${query ? 'AND' : ''} analysis.event ILIKE :event`
    }

    const [items, total] = await this.analysisRepository
      .createQueryBuilder('analysis')
      .where(query, {
        ip: `%${ip}%`,
        event: `%${event}%`,
        referrer: `%${referrer}%`
      })
      .orderBy(`analysis.${order}`, direction)
      .skip(size * page)
      .take(size)
      .getManyAndCount()

    return {
      totalItems: total,
      totalPages: Math.ceil(total / size),
      currentPage: page,
      items,
      limit: size
    }
  }
}
