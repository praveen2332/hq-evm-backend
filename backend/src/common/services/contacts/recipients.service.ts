import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { PaginationResponse } from '../../../core/interfaces'
import { RecipientQuery } from '../../../recipients/interface'
import { Recipient } from './recipient.entity'

@Injectable()
export class RecipientsService extends BaseService<Recipient> {
  constructor(
    @InjectRepository(Recipient)
    private recipientsRepository: Repository<Recipient>
  ) {
    super(recipientsRepository)
  }

  async getRecipients(options: RecipientQuery, organizationId: string): Promise<PaginationResponse<Recipient>> {
    const size = options.size || 10
    const page = options.page || 0
    const search = (options.search || '').trim()
    const order = options.order || 'updatedAt'
    const direction = (options.direction || 'DESC') as 'DESC' | 'ASC'
    const { type } = options

    let query =
      'organization.publicId = :organizationId AND (r1.address ILIKE :search OR recipient.contactName ILIKE :search OR recipient.organizationName ILIKE :search OR recipient.organizationAddress ILIKE :search)'

    if (type) {
      query += ' AND recipient.type = :type'
    }

    const [items, total] = await this.recipientsRepository
      .createQueryBuilder('recipient')
      .leftJoinAndSelect('recipient.organization', 'organization')
      .leftJoinAndSelect('recipient.recipientContacts', 'recipientContacts')
      .leftJoinAndSelect('recipientContacts.contactProvider', 'contactProvider')
      .leftJoinAndSelect('recipient.recipientAddresses', 'r1')
      .leftJoinAndSelect('recipient.recipientAddresses', 'r2')
      .leftJoinAndSelect('r2.token', 'token')
      .where(query, {
        organizationId,
        search: `%${search}%`,
        type
      })
      .orderBy(`recipient.${order}`, direction)
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

  async getAllRecipients(organizationId: string): Promise<Recipient[]> {
    const query = 'recipient."organization_id" = :organizationId'

    const sql = this.recipientsRepository
      .createQueryBuilder('recipient')
      .leftJoinAndSelect('recipient.recipientAddresses', 'r1')
      .where(query, {
        organizationId
      })

    return sql.getMany()
  }

  getByOrganizationIdChainAndNameOrAddress(params: {
    organizationId: string
    blockchainId?: string
    nameOrAddress?: string
  }) {
    let query = 'organization.id = :organizationId'

    if (params.nameOrAddress) {
      query += ` AND (r1.address ILIKE :search OR recipient.contactName ILIKE :search OR recipient.organizationName ILIKE :search OR recipient.organizationAddress ILIKE :search)`
    }

    if (params.blockchainId) {
      query += ' AND blockchain_id= :blockchainId'
    }

    const sql = this.recipientsRepository
      .createQueryBuilder('recipient')
      .leftJoinAndSelect('recipient.organization', 'organization')
      .leftJoinAndSelect('recipient.recipientContacts', 'recipientContacts')
      .leftJoinAndSelect('recipientContacts.contactProvider', 'contactProvider')
      .leftJoinAndSelect('recipient.recipientAddresses', 'r2')
      .leftJoinAndSelect('r2.token', 'token')
      .leftJoin('recipient.recipientAddresses', 'r1')
      .where(query, {
        organizationId: params.organizationId,
        search: `%${params.nameOrAddress}%`,
        blockchainId: params.blockchainId
      })
    return sql.getMany()
  }
}
