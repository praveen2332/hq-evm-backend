import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { format, subDays } from 'date-fns'
import { Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { CsvStringifierFactory } from '../common/csv/csv-stringifier-factory'
import { transactionsHelper } from '../common/helpers/transactions.helper'
import { RecipientsService } from '../common/services/contacts/recipients.service'
import { BaseService } from '../core/base.service'
import { SourceType } from '../source-of-funds/interfaces'
import { SourceOfFundGnosis } from '../source-of-funds/source-of-fund.entity'
import {
  ETransactionType,
  SyncTransactionDto,
  TransactionExportCSVQueryParams,
  TransactionQueryParams
} from './interfaces'
import { Transaction } from './transaction.entity'

@Injectable()
export class TransactionsService extends BaseService<Transaction> {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private recipientsService: RecipientsService
  ) {
    super(transactionsRepository)
  }

  async getSafeTransactionByHash(safeAddress: string, chainId: number, hash: string) {
    return this.transactionsRepository.findOne({ where: { safeAddress, chainId, hash } as any })
  }

  async getSafeTransactionBySafeHash(safeAddress: string, chainId: number, safeHash: string) {
    return this.transactionsRepository.findOne({ where: { safeAddress, chainId, safeHash } as any })
  }

  async getTransactions(sources: SourceOfFundGnosis[], options: TransactionQueryParams) {
    const size = options.size || 10
    const page = options.page || 0
    let search = (options.search || '').trim()
    const toAddress = options.toAddress ? options.toAddress.split(',').map((item) => item.toLowerCase()) : undefined
    const fromAddress = options.fromAddress
      ? options.fromAddress.split(',').map((item) => item.toLowerCase())
      : undefined
    let order = 'transaction.timeStamp'
    let direction: 'DESC' | 'ASC' = 'DESC'
    const type = options.type
    const blockchainId = options.blockchainId ? options.blockchainId : null
    const sourceIds = sources.map((source) => source.id)
    const sourceAddresses = sources.map((source) => (source.address ? source.address.toLowerCase() : ''))
    const incomingAddresses = sources
      .filter((source) => source.sourceType === SourceType.ETH)
      .map((source) => (source.address ? source.address.toLowerCase() : ''))
    const lastDays = options.lastDays
    const date = lastDays ? format(subDays(new Date(), lastDays), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    const organizationId = (sources && sources[0] && sources[0]?.organization?.id) || null
    const categoryIds = (options.categoryIds && options.categoryIds.split(',')) || null
    const startTime = options.startTime || null
    const endTime = options.endTime || null
    const symbols = (options.symbols && options.symbols.split(',')) || null
    let query = 'transaction.source_of_fund_id IN (:...sourceIds)'
    switch (type) {
      case ETransactionType.QUEUE:
        query += ` AND transaction.is_executed = false AND (transaction.is_draft is NULL OR transaction.is_draft = false)`
        break
      case ETransactionType.INCOMING:
        query += ` AND transaction.is_executed = true AND transaction.type = 'incoming'`
        break
      case ETransactionType.OUTGOING:
        query += ` AND transaction.is_executed = true AND transaction.type = 'outgoing'`
        break
      case ETransactionType.DRAFT:
        query += ` AND transaction.is_draft = true`
        break
      default:
        query += ` AND transaction.is_executed = true AND (transaction.is_draft is NULL OR transaction.is_draft = false)`
        break
    }
    if (blockchainId !== null) {
      query += ` AND (transaction.blockchain_id = :blockchainId)`
    }
    if (search) {
      const sourceAddress = sources.find((source) => source.name === search)
      if (sourceAddress) {
        search = sourceAddress.address
      }
    }
    if (search) {
      query += `  AND ( EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t  WHERE t->>'address' ILIKE :search) OR ${
        type === ETransactionType.QUEUE ? 'transaction.safe_hash ILIKE :search' : 'transaction.hash ILIKE :search'
      } OR EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t WHERE t ->> 'address' IN (SELECT address FROM recipient r JOIN recipient_address ra ON r.id = ra.recipient_id WHERE (r.contact_name ILIKE :search OR r.organization_name ILIKE :search)
        AND ra."chainId" = :chainId ${organizationId ? 'AND r.organization_id = :organizationId' : ''})))`
    }

    if (fromAddress) {
      query += ` AND ((LOWER(transaction.metamask_transaction->>'from')  IN (:...fromAddress)) OR (LOWER(transaction.safe_transaction->>'from') IN (:...fromAddress)) OR (LOWER(transaction.safe_transaction->>'safe') IN (:...fromAddress)))`
    }
    if (toAddress) {
      query += ` AND (EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t  WHERE LOWER(t->>'address') IN (:...toAddress)))`
    }
    if (lastDays) {
      query += ` AND transaction.time_stamp > :date`
    }
    if (startTime && endTime) {
      if (type === ETransactionType.QUEUE) {
        query += ` AND transaction.submissionDate BETWEEN :startTime AND :endTime`
      } else query += ` AND transaction.time_stamp BETWEEN :startTime AND :endTime`
    }
    if (type === ETransactionType.QUEUE) {
      order = `nonce`
      direction = 'ASC'
    }
    if (symbols) {
      query += ` AND transaction.symbol IN (:...symbols)`
    }
    if (categoryIds) {
      query += ` AND categories.id IN (:...categoryIds)`
    }

    const items = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .addSelect(`(transaction.safe_transaction->>'nonce')::int`, 'nonce')
      .leftJoinAndSelect('transaction.source', 'source')
      .leftJoinAndSelect('transaction.categories', 'categories')
      .where(query, {
        sourceIds,
        sourceAddresses,
        incomingAddresses,
        organizationId,
        categoryIds,
        blockchainId,
        search: `%${search}%`,
        date,
        startTime,
        endTime,
        symbols,
        fromAddress,
        toAddress
      })
      .orderBy(order, direction)
      .addOrderBy('transaction.type', 'DESC')
      .getMany()

    const filterItems = this.removeDuplicateTransactions(items)
    const total = filterItems.length

    return {
      totalItems: total,
      totalPages: Math.ceil(total / size),
      currentPage: page,
      items: filterItems.splice(size * page, size),
      limit: size
    }
  }

  async getTransactionsForCSVExport(sources: SourceOfFundGnosis[], options: TransactionExportCSVQueryParams) {
    let search = (options.search || '').trim()
    const toAddress = options.toAddress ? options.toAddress.split(',').map((item) => item.toLowerCase()) : undefined
    const fromAddress = options.fromAddress
      ? options.fromAddress.split(',').map((item) => item.toLowerCase())
      : undefined
    const order = 'transaction.timeStamp'
    const direction = 'DESC'
    const type = options.type
    const blockchainId = options.blockchainId ? options.blockchainId : null
    const sourceIds = sources.map((source) => source.id)
    const sourceAddresses = sources.map((source) => (source.address ? source.address.toLowerCase() : ''))
    const incomingAddresses = sources
      .filter((source) => source.sourceType === SourceType.ETH)
      .map((source) => (source.address ? source.address.toLowerCase() : ''))
    const lastDays = options.lastDays
    const date = lastDays ? format(subDays(new Date(), lastDays), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
    const organizationId = (sources && sources[0] && sources[0]?.organization?.id) || null
    const categoryIds = (options.categoryIds && options.categoryIds.split(',')) || null
    const startTime = options.startTime || null
    const endTime = options.endTime || null
    const symbols = (options.symbols && options.symbols.split(',')) || null
    let query = 'transaction.source_of_fund_id IN (:...sourceIds)'
    if (type === ETransactionType.INCOMING) {
      query += ` AND transaction.is_executed = true AND transaction.type = 'incoming'`
    } else if (type === ETransactionType.OUTGOING) {
      query += ` AND transaction.is_executed = true AND transaction.type = 'outgoing'`
    } else {
      query += ` AND transaction.is_executed = true`
    }

    if (blockchainId !== null) {
      query += ` AND transaction.blockchain_id = :blockchainId`
    }

    if (search) {
      const sourceAddress = sources.find((source) => source.name === search)
      if (sourceAddress) {
        search = sourceAddress.address
      }

      query += `  AND (EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t  WHERE t->>'address' ILIKE :search) OR (transaction.safe_hash ILIKE :search OR transaction.hash ILIKE :search)
      OR EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t WHERE t ->> 'address' IN (SELECT address FROM recipient r JOIN recipient_address ra ON r.id = ra.recipient_id WHERE (r.contact_name ILIKE :search OR r.organization_name ILIKE :search) AND ra."chainId" = :chainId ${
        organizationId ? 'AND r.organization_id = :organizationId' : ''
      })))`
    }

    if (fromAddress) {
      query += ` AND ((LOWER(transaction.metamask_transaction->>'from')  IN (:...fromAddress)) OR (LOWER(transaction.safe_transaction->>'from') IN (:...fromAddress)) OR (LOWER(transaction.safe_transaction->>'safe') IN (:...fromAddress)))`
    }
    if (toAddress) {
      query += ` AND (EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t  WHERE LOWER(t->>'address') IN (:...toAddress)))`
    }
    if (lastDays) {
      query += ` AND transaction.time_stamp > :date`
    }
    if (startTime && endTime) {
      query += ` AND transaction.time_stamp BETWEEN :startTime AND :endTime`
    }
    if (symbols) {
      query += ` AND transaction.symbol IN (:...symbols)`
    }
    if (categoryIds) {
      query += ` AND categories.id IN (:...categoryIds)`
    }

    const items = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .addSelect(`(transaction.safe_transaction->>'nonce')::int`, 'nonce')
      .leftJoinAndSelect('transaction.source', 'source')
      .leftJoinAndSelect('transaction.categories', 'categories')
      .where(query, {
        sourceIds,
        sourceAddresses,
        incomingAddresses,
        organizationId,
        categoryIds,
        blockchainId,
        search: `%${search}%`,
        date,
        startTime,
        endTime,
        symbols,
        fromAddress,
        toAddress
      })
      .orderBy(order, direction)
      .addOrderBy('transaction.type', 'DESC')
      .getMany()

    return this.removeDuplicateTransactions(items)
  }

  async getSourceTransactions(source: SourceOfFundGnosis, options: TransactionQueryParams) {
    const size = options.size || 10
    const page = options.page || 0
    const search = (options.search || '').trim()
    const order = options.order || 'timeStamp'
    const direction = options.direction || 'DESC'
    const type = options.type
    const blockchainId = options.blockchainId || null
    const sourceId = source.id
    const sourceAddress = source.address.toLowerCase()
    const startTime = options.startTime || null
    const endTime = options.endTime || null
    const organizationId = (source && source?.organization?.id) || null

    const symbols = (options.symbols && options.symbols.split(',')) || null
    const categoryIds = (options.categoryIds && options.categoryIds.split(',')) || null

    let query = 'transaction.source_of_fund_id = :sourceId'
    switch (type) {
      case ETransactionType.QUEUE:
        query += ` AND transaction.is_executed = false AND (transaction.is_draft is NULL OR transaction.is_draft = false)`

        break
      case ETransactionType.INCOMING:
        query += ` AND transaction.is_executed = true AND transaction.type = 'incoming'`
        break
      case ETransactionType.OUTGOING:
        query += ` AND transaction.is_executed = true AND transaction.type = 'outgoing'`
        break
      case ETransactionType.DRAFT:
        query += ` AND transaction.is_draft = true`
        break
      default:
        query += ` AND transaction.is_executed = true AND (transaction.is_draft is NULL OR transaction.is_draft = false)`
        break
    }
    if (blockchainId !== null) {
      query += ` AND transaction.blockchain_id = :blockchainId`
    }

    if (search) {
      query += `  AND ( EXISTS ( SELECT * FROM json_array_elements(transaction.recipients) as t  WHERE t->>'address' ILIKE :search) OR ${
        type === ETransactionType.QUEUE ? 'transaction.safe_hash ILIKE :search' : 'transaction.hash ILIKE :search'
      } OR EXISTS (SELECT * FROM json_array_elements(transaction.recipients) as t WHERE t ->> 'address' IN (SELECT address FROM recipient r JOIN recipient_address ra ON r.id = ra.recipient_id WHERE (r.contact_name ILIKE :search OR r.organization_name ILIKE :search) AND ra."chainId" = :chainId ${
        organizationId ? 'AND r.organization_id = :organizationId' : ''
      })))`
    }

    if (startTime && endTime) {
      if (type === ETransactionType.QUEUE) {
        query += ` AND transaction.submissionDate BETWEEN :startTime AND :endTime`
      } else query += ` AND transaction.time_stamp BETWEEN :startTime AND :endTime`
    }

    if (symbols) {
      query += ` AND transaction.symbol IN (:...symbols)`
    }

    if (categoryIds) {
      query += ` AND categories.id IN (:...categoryIds)`
    }

    const [items, total] = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.source', 'source')
      .leftJoinAndSelect('transaction.categories', 'categories')
      .where(query, {
        sourceId,
        blockchainId,
        sourceAddress,
        organizationId,
        categoryIds,
        search: `%${search}%`,
        startTime,
        endTime,
        symbols
      })
      .orderBy('transaction.timeStamp', 'DESC')
      .addOrderBy('transaction.type', 'DESC')
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

  async getTransactionByNonce(syncTransactionDto: SyncTransactionDto) {
    const { sourceId, blockchainId, nonce, safeHash } = syncTransactionDto

    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.categories', 'categories')
      .where(
        `transaction.source_of_fund_id = :sourceId AND transaction.blockchain_id = :blockchainId AND transaction.safe_transaction->>'nonce' = :nonce AND transaction.safe_hash != :safeHash`,
        { sourceId, blockchainId, nonce: nonce.toString(), safeHash }
      )
      .getOne()
  }

  async getPendingTransactionsByNonce(sourceId: string, nonce: number) {
    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoinAndSelect('transaction.categories', 'categories')
      .where(
        `transaction.source_of_fund_id = :sourceId AND transaction.safe_transaction->>'nonce' = :nonce AND (transaction.safe_transaction->>'isExecuted')::boolean is false`,
        {
          sourceId,
          nonce: nonce.toString()
        }
      )
      .getMany()
  }

  async getCSVData(sources: SourceOfFundGnosis[], options: TransactionExportCSVQueryParams) {
    const organizationId = (sources && sources[0] && sources[0]?.organization?.id) || null

    const [transactions, recipients] = await Promise.all([
      this.getTransactionsForCSVExport(sources, options),
      this.recipientsService.getAllRecipients(organizationId)
    ])
    const csvStringifier = CsvStringifierFactory.createArrayCsvStringifier({
      header: ['Date', 'Amount', 'Payee', 'Description', 'Reference', 'Analysis Code', 'Has Error', 'Error Message']
    })

    const data: string[][] = []
    for (const transaction of transactions) {
      if (transaction.recipients) {
        for (const recipient of transaction.recipients) {
          const contactName = transactionsHelper.getContactName(recipients, sources, recipient.address)
          const { hasError, error } = transactionsHelper.getErrorsField(recipient.pastUSDPrice)
          data.push([
            format(transaction.timeStamp, 'dd-MM-yyyy'),
            transactionsHelper.formatPrice(recipient.pastUSDPrice, transaction.type),
            contactName ? `${contactName} - ${recipient.address}` : recipient.address,
            this.getCSVDescription({
              bottomNote: transaction.comment,
              tokenAmount: recipient.amount,
              symbol: transactionsHelper.getSymbol(transaction)
            }),
            transaction.hash,
            transaction.categories.map((c) => c.name).join(', ') ?? '',
            hasError ? 'Yes' : 'No',
            error
          ])
        }
      }
      const isContractInteractions = !transaction.recipients?.length

      const from =
        (transaction.metamaskTransaction && transaction.metamaskTransaction.from) ||
        (transaction.safeTransaction && transaction.safeTransaction.from)

      if (
        transaction.type === ETransactionType.OUTGOING ||
        (transaction.type === ETransactionType.INCOMING &&
          sources.find((source) => source.address && source.address.toLowerCase() === from.toLowerCase()))
      ) {
        const { hasError, error } = transactionsHelper.getErrorsField(transaction.pastUSDGasFee)
        data.push([
          format(transaction.timeStamp, 'dd-MM-yyyy'),
          transactionsHelper.formatPrice(transaction.pastUSDGasFee, ETransactionType.OUTGOING),
          transactionsHelper.getTo(transaction),
          this.getCSVDescription({
            topNote: `${isContractInteractions ? 'Contract interaction: ' : ''} Gas fee`,
            tokenAmount: transactionsHelper.getFee(transaction),
            symbol: SourceType.ETH
          }),
          transaction.hash,
          transaction.categories.map((c) => c.name).join(', ') ?? '',
          hasError ? 'Yes' : 'No',
          error
        ])
      }
    }
    return csvStringifier.getCsvByPages(data)
  }

  getCSVDescription(params: { topNote?: string; bottomNote?: string; symbol: string; tokenAmount: string }) {
    return `${params.topNote ?? ''} ${params.symbol} - ${params.tokenAmount} ${params.bottomNote ?? ''}`
  }

  removeDuplicateTransactions(transactions: Transaction[]) {
    return [...new Map(transactions.map((transaction) => [transaction.hash || uuidv4(), transaction])).values()]
  }

  async getAllTransactions(sources: SourceOfFundGnosis[], blockchainId: string) {
    const sourceIds = sources.map((source) => source.id)
    let query = `transaction.is_executed = true AND (transaction.is_draft is NULL OR transaction.is_draft = false) AND transaction.blockchain_id = :blockchainId `
    if (sourceIds?.length) {
      query += ` AND transaction.source_of_fund_id IN (:...sourceIds)`
    }
    return this.transactionsRepository
      .createQueryBuilder('transaction')
      .addSelect(`(transaction.safe_transaction->>'nonce')::int`, 'nonce')
      .leftJoinAndSelect('transaction.source', 'source')
      .leftJoinAndSelect('transaction.categories', 'categories')
      .where(query, {
        sourceIds,
        blockchainId
      })
      .getMany()
  }
}
