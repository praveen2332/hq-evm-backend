import { Injectable } from '@nestjs/common'
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  FindOptionsWhere,
  ILike,
  Repository
} from 'typeorm'
import { PaginationParams, PaginationResponse } from './interfaces'

@Injectable()
export class BaseService<T> {
  constructor(private readonly genericRepository: Repository<T>) {}

  async create(entity: DeepPartial<T>): Promise<T> {
    const created = await this.genericRepository.save(entity)
    return {
      ...entity,
      ...created
    }
  }

  getAll(): Promise<T[]> {
    return this.genericRepository.find()
  }

  async getAllPaging(
    options: PaginationParams,
    searchFields: string[],
    conditionalFields: Record<string, string | number | Record<string, string | number | FindOperator<string>>> = null,
    relations: string[] = [],
    withDeleted = false
  ): Promise<PaginationResponse<T>> {
    const size = options.size || 10
    const page = options.page || 0
    const search = (options.search || '').trim()
    const order = options.order || 'createdAt'
    const direction = options.direction || 'DESC'
    let filter = []
    for (const field of searchFields) {
      const fields = field.split('.')
      let i = fields.length - 1
      let query: any = { [fields[i]]: ILike(`%${search}%`) }
      while (i > 0) {
        i--
        query = { [fields[i]]: query }
      }
      if (conditionalFields) {
        filter.push({ ...query, ...conditionalFields })
      } else {
        filter.push({ ...query })
      }
    }
    if (!filter.length && conditionalFields) {
      filter = [conditionalFields]
    }

    if (filter.length) {
      const [items, total] = await this.genericRepository.findAndCount({
        where: filter,
        relations,
        order: {
          [order]: direction
        },
        take: size,
        skip: page * size,
        withDeleted
      } as FindManyOptions<T>)

      return {
        totalItems: total,
        totalPages: Math.ceil(total / size),
        currentPage: page,
        items,
        limit: size
      }
    }
    if (!filter.length && conditionalFields) {
      filter = [conditionalFields]
    }

    const [items, total] = await this.genericRepository.findAndCount({
      relations,
      order: {
        [order]: direction
      },
      take: size,
      skip: page * size
    } as FindManyOptions<T>)

    return {
      totalItems: total,
      totalPages: Math.ceil(total / size),
      currentPage: page,
      items,
      limit: size
    }
  }

  get(id: string | number, options?: FindOneOptions<T>): Promise<T> {
    return this.genericRepository.findOne({ where: { id } as any, ...options })
  }

  findByPublicId(publicId: string, relations?: string[]): Promise<T> {
    if (relations) {
      return this.genericRepository.findOne({ where: { publicId } as any, relations })
    }
    return this.genericRepository.findOne({ where: { publicId } as any })
  }

  findOne(options: FindOneOptions<T>): Promise<T> {
    return this.genericRepository.findOne(options)
  }

  find(options: FindManyOptions<T>): Promise<T[]> {
    return this.genericRepository.find(options)
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.genericRepository.softDelete(id)
    return !!result.affected
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.genericRepository.delete(id)
    return !!result.affected
  }

  async remove(entity: T): Promise<T> {
    return this.genericRepository.remove(entity)
  }

  async removeAll(entities: T[]): Promise<T[]> {
    return this.genericRepository.remove(entities)
  }

  restore(options: FindOptionsWhere<T>) {
    return this.genericRepository.restore(options)
  }

  update(entity: DeepPartial<T>): Promise<T> {
    return this.genericRepository.save(entity)
  }

  async partiallyUpdate(id: string, data: Partial<T>): Promise<Partial<T>> {
    await this.genericRepository.update(id, data as any)
    return {
      ...data
    }
  }

  count(options: FindManyOptions<T>): Promise<number> {
    return this.genericRepository.count(options)
  }
}
