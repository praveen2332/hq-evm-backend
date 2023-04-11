import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../core/base.service'
import { PaginationResponse } from '../core/interfaces'
import { Category } from './category.entity'
import { CategoriesQuery } from './interfaces'

@Injectable()
export class CategoriesService extends BaseService<Category> {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>
  ) {
    super(categoriesRepository)
  }

  async getCategories(options: CategoriesQuery, organizationId: string): Promise<PaginationResponse<Category>> {
    const size = options.size || 10
    const page = options.page || 0
    const search = (options.search || '').trim()
    const order = options.order || 'updatedAt'
    const direction = (options.direction || 'DESC') as 'DESC' | 'ASC'
    const type = options.type ? options.type.split(',') : undefined

    let query = 'organization.publicId = :organizationId'

    if (type) {
      query += ' AND category.type in (:...type)'
    }

    if (search) {
      query += ' AND ("category"."name" ILIKE :search OR "category"."code" ILIKE :search)'
    }

    const [items, total] = await this.categoriesRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.organization', 'organization')
      .leftJoinAndSelect('category.createdBy', 'createdBy')
      .where(query, {
        organizationId,
        search: `%${search}%`,
        type
      })
      .orderBy(`category.${order}`, direction)
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
  async deleteAllCategory(organizationId: string) {
    return await this.categoriesRepository.delete({
      organization: {
        id: organizationId
      }
    })
  }

  async getByOrganizationIdAndPublicId(params: { publicId: string; organizationId: string; relations?: string[] }) {
    return await this.categoriesRepository.findOne({
      where: {
        publicId: params.publicId,
        organization: {
          id: params.organizationId
        }
      },
      relations: params.relations
    })
  }
}
