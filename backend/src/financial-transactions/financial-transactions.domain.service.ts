import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { format } from 'date-fns'
import { CategoriesService } from '../categories/categories.service'
import { networkConfigs } from '../common/constants'
import { CsvStringifierFactory } from '../common/csv/csv-stringifier-factory'
import { csvUtils } from '../common/csv/utils'
import { dateHelper } from '../common/helpers/date.helper'
import { transactionsHelper } from '../common/helpers/transactions.helper'
import { LoggerService } from '../common/logger/logger.service'
import { ContactDto } from '../common/services/contacts/contact'
import { ContactsService } from '../common/services/contacts/contacts.service'
import { FinancialTransactionChildMetadata } from '../common/services/financial-transactions/financial-transaction-child-metadata.entity'
import { FinancialTransactionChild } from '../common/services/financial-transactions/financial-transaction-child.entity'
import { FinancialTransactionFile } from '../common/services/financial-transactions/financial-transaction-files.entity'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import { FinancialTransactionChildMetadataDirection } from '../common/services/financial-transactions/interfaces'
import { OrganizationSettingsService } from '../common/services/organization-settings/organization-settings.service'
import { PaginationResponse } from '../core/interfaces'
import { FilesService } from '../files/files.service'
import { FinancialTransformationsEventType } from '../financial-transformations/events/events'
import {
  FinancialTransactionDto,
  FinancialTransactionFileDto,
  FinancialTransactionParentDetailDto,
  FinancialTransactionQueryParams,
  FinancialTransactionUpdateDto
} from './interfaces'

// 22/12/2022, 03:30 PM
const EXPORT_DATETIME_FORMAT = 'dd/MM/yyyy HH:mm:ss'
// 22-12-2022,
const XERO_DATE_FORMAT = 'dd-MM-yyyy'

@Injectable()
export class FinancialTransactionsDomainService {
  constructor(
    private financialTransactionsEntityService: FinancialTransactionsEntityService,
    private contactsService: ContactsService,
    private categoriesService: CategoriesService,
    private filesService: FilesService,
    private eventEmitter: EventEmitter2,
    private logger: LoggerService,
    private organizationSettingsService: OrganizationSettingsService
  ) {}

  async getAllPaging(organizationId: string, query: FinancialTransactionQueryParams) {
    const result = await this.financialTransactionsEntityService.getAllChildPaging(query, organizationId)
    const items = await this.convertToDto(organizationId, result.items)
    return PaginationResponse.from({
      items: items,
      limit: result.limit,
      totalItems: result.totalItems,
      currentPage: result.currentPage
    })
  }

  async getCSVForExport(organizationId: string, query: FinancialTransactionQueryParams) {
    const result = await this.financialTransactionsEntityService.getAllChildren(query, organizationId)
    const financialTransactionDtos = await this.convertToDto(organizationId, result)

    const csvStringifier = CsvStringifierFactory.createArrayCsvStringifier({
      header: ['Date', 'Amount', 'Payee', 'Description', 'Reference', 'Analysis Code', 'Has Error', 'Error Message']
    })

    const data: string[][] = []
    for (const transaction of financialTransactionDtos) {
      const { hasError, error } = transactionsHelper.getErrorsField(transaction.fiatAmount)
      data.push([
        format(transaction.valueTimestamp, XERO_DATE_FORMAT),
        transactionsHelper.formatFiatPrice(transaction.fiatAmount, transaction.type, 2),
        transaction.fromContact
          ? `${transaction.fromContact.name} - ${transaction.fromAddress}`
          : transaction.fromAddress,
        this.getCSVDescription({
          bottomNote: '', //TODO: Transaction comment.
          tokenAmount: transaction.cryptocurrencyAmount,
          symbol: transaction.cryptocurrency.symbol
        }),
        transaction.hash,
        transaction.category?.name ?? '',
        hasError ? 'Yes' : 'No',
        error
      ])
    }
    return csvStringifier.getCsvByPages(data)
  }

  async getTxsCSV(organizationId: string, query: FinancialTransactionQueryParams): Promise<string> {
    const result = await this.financialTransactionsEntityService.getAllChildren(query, organizationId)

    if (!result.length) {
      throw new NotFoundException('No transactions found')
    }

    const financialTransactionDtos = await this.convertToDto(organizationId, result)
    const csvStringifier = CsvStringifierFactory.createArrayCsvStringifier({
      header: [
        'Date Time',
        'Txn Hash',
        'Type',
        'From Wallet',
        'To Wallet',
        'Token Name',
        'Token Amount In',
        'Token Amount Out',
        'Fiat Value In',
        'Fiat Value Out',
        'Gains/Loss',
        'Category',
        'Notes'
      ]
    })

    const data: string[][] = []
    const organizationSetting = await this.organizationSettingsService.getByOrganizationId(organizationId, {
      timezone: true
    })

    for (const transaction of financialTransactionDtos) {
      const chainId = transaction.blockchainId === 'goerli' ? 5 : 1

      const txUrl = networkConfigs[chainId].urlToTx(transaction.hash)

      const fromWalletUrl = networkConfigs[chainId].urlToAddress(transaction.fromAddress)
      const fromWalletName = transaction.fromContact?.name ?? transaction.fromAddress

      const toWalletUrl = networkConfigs[chainId].urlToAddress(transaction.toAddress)
      const toWalletName = transaction.toContact?.name ?? transaction.toAddress

      const tokenAddress = transaction.cryptocurrency.addresses.find(
        (a) => a.blockchainId === transaction.blockchainId
      )?.address
      const tokenUrl = networkConfigs[chainId].urlToAddress(tokenAddress)
      const tokenName = transaction.cryptocurrency.symbol
      const isIn = transaction.direction === FinancialTransactionChildMetadataDirection.INCOMING
      const isOut = transaction.direction === FinancialTransactionChildMetadataDirection.OUTGOING

      const zonedDate = dateHelper.utcToZonedTime(transaction.valueTimestamp, organizationSetting.timezone.utcOffset)
      data.push([
        format(zonedDate, EXPORT_DATETIME_FORMAT),
        csvUtils.getHyperlink(txUrl, transaction.hash),
        transaction.typeDetail.label,
        csvUtils.getHyperlink(fromWalletUrl, fromWalletName),
        toWalletName ? csvUtils.getHyperlink(toWalletUrl, toWalletName) : '',
        tokenAddress ? csvUtils.getHyperlink(tokenUrl, tokenName) : tokenName,
        isIn ? transaction.cryptocurrencyAmount : '',
        isOut ? transaction.cryptocurrencyAmount : '',
        isIn ? transaction.fiatAmount : '',
        isOut ? transaction.fiatAmount : '',
        transaction.gainLoss ?? '',
        transaction.category?.name ?? '',
        transaction.note
      ])
    }
    return csvStringifier.getCsvString(data)
  }

  getCSVDescription(params: { topNote?: string; bottomNote?: string; symbol: string; tokenAmount: string }) {
    return `${params.topNote ?? ''} ${params.symbol} - ${params.tokenAmount} ${params.bottomNote ?? ''}`
  }

  private async convertToDto(organizationId: string, items: FinancialTransactionChild[]) {
    const contacts: ContactDto[] = await this.contactsService.getByOrganizationIdAndNameOrAddress({
      organizationId
    })

    const contactsGrouped = this.contactsService.groupContactDtosByAddress(contacts)

    const financialTransactionDtos = items.map((transactionChild) =>
      FinancialTransactionDto.map(transactionChild, true)
    )

    for (const dto of financialTransactionDtos) {
      dto.fromContact = contactsGrouped[dto.fromAddress?.toLowerCase()]
      dto.toContact = contactsGrouped[dto.toAddress?.toLowerCase()]

      if (dto.gnosisMetadata?.confirmations) {
        for (const confirmation of dto.gnosisMetadata.confirmations) {
          confirmation.ownerContact = contactsGrouped[confirmation.owner?.toLowerCase()]
        }
      }
    }
    return financialTransactionDtos
  }

  async getParentByHashAndOrganization(params: { parentHash: string; organizationId: string; childPublicId: string }) {
    const parent = await this.financialTransactionsEntityService.getParentByHashAndOrganization(
      params.parentHash,
      params.organizationId
    )

    if (!parent) {
      throw new BadRequestException('There is no given hash in the organization')
    }

    if (!parent.financialTransactionChild.find((child) => child.publicId === params.childPublicId)) {
      throw new BadRequestException('Invalid financialTransactionId and hash combination')
    }

    return FinancialTransactionParentDetailDto.map(parent)
  }

  async update(params: {
    organizationId: string
    childPublicId: string
    accountId: string
    body: FinancialTransactionUpdateDto
  }): Promise<FinancialTransactionDto> {
    const financialTransactionChild =
      await this.financialTransactionsEntityService.getChildWithMetadataByOrganizationIdAndPublicId({
        organizationId: params.organizationId,
        publicId: params.childPublicId
      })

    if (!financialTransactionChild) {
      throw new BadRequestException('There is no given financial transaction in the organization')
    }

    let newFinTxMetadata: Partial<FinancialTransactionChildMetadata> = {}
    let toResyncPriceForChildId = false

    if (params.body.categoryId) {
      const category = await this.categoriesService.getByOrganizationIdAndPublicId({
        organizationId: params.organizationId,
        publicId: params.body.categoryId
      })
      if (!category) {
        throw new BadRequestException('There is no given category in the organization')
      }
      newFinTxMetadata = {
        ...newFinTxMetadata,
        category
      }
    }
    if (params.body.amountPerUnit) {
      const updatedMetadata = await this.financialTransactionsEntityService.generatePartialChildMetadataForPriceUpdate({
        cryptocurrencyAmount: financialTransactionChild.cryptocurrencyAmount,
        pricePerUnit: params.body.amountPerUnit,
        fiatCurrency: financialTransactionChild.financialTransactionChildMetadata.fiatCurrency,
        updatedBy: `account_${params.accountId}`
      })
      newFinTxMetadata = { ...newFinTxMetadata, ...updatedMetadata }
      toResyncPriceForChildId = true
    }

    if (params.body.amount) {
      const updatedMetadata = await this.financialTransactionsEntityService.generatePartialChildMetadataForPriceUpdate({
        cryptocurrencyAmount: financialTransactionChild.cryptocurrencyAmount,
        totalPrice: params.body.amount,
        fiatCurrency: financialTransactionChild.financialTransactionChildMetadata.fiatCurrency,
        updatedBy: `account_${params.accountId}`
      })
      newFinTxMetadata = { ...newFinTxMetadata, ...updatedMetadata }
      toResyncPriceForChildId = true
    }

    if (params.body.note !== undefined) {
      newFinTxMetadata = {
        ...newFinTxMetadata,
        note: params.body.note
      }
    }

    // TODO: refactor this hardcoded logic to be cleaner
    if (!Object.keys(newFinTxMetadata).length /*&& !params.body?.status*/) {
      throw new BadRequestException('No valid fields to update')
    }

    await this.financialTransactionsEntityService.updateChildMetadataByChildId(
      financialTransactionChild.id,
      newFinTxMetadata
    )

    // if (params.body.status) {
    //   await this.financialTransactionsEntityService.changeChildStatus({
    //     organizationId: params.organizationId,
    //     childId: financialTransactionChild.id,
    //     childMetadataId: financialTransactionChild.financialTransactionChildMetadata.id,
    //     status: params.body.status
    //   })
    // }

    if (toResyncPriceForChildId) {
      this.eventEmitter.emit(
        FinancialTransformationsEventType.OPERATIONAL_TRANSFORMATION_RESYNC_PRICE_FOR_TRANSACTION_CHILD,
        financialTransactionChild.id
      )
    }

    const updatedFinancialTransactionChild = await this.financialTransactionsEntityService.getChildWithAllRelationsById(
      financialTransactionChild.id
    )

    return FinancialTransactionDto.map(updatedFinancialTransactionChild, true)
  }

  async uploadFiles(param: { organizationId: string; childPublicId: string; files: Express.Multer.File[] }) {
    const financialTransactionChild =
      await this.financialTransactionsEntityService.getChildWithMetadataByOrganizationIdAndPublicId({
        organizationId: param.organizationId,
        publicId: param.childPublicId
      })

    if (!financialTransactionChild) {
      throw new BadRequestException('There is no given financial transaction in the organization')
    }

    const files: FinancialTransactionFileDto[] = []

    for (const file of param.files) {
      const { filePath, key } = await this.filesService.uploadTransactionAttachment(file, {
        organizationId: param.organizationId,
        childId: financialTransactionChild.id
      })
      const attachment = FinancialTransactionFile.create({
        filePath,
        file: {
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype
        },
        key,
        financialTransactionChildId: financialTransactionChild.id,
        organizationId: param.organizationId
      })
      const savedFile = await this.financialTransactionsEntityService.saveFile(attachment)
      files.push(FinancialTransactionFileDto.map(savedFile))
    }

    return files
  }

  async getFileStream(param: { organizationId: string; childPublicId: string; publicFileId: string }) {
    const financialTransactionFile = await this.financialTransactionsEntityService.getFileByOrganizationIdAndPublicId({
      organizationId: param.organizationId,
      publicId: param.publicFileId,
      childPublicId: param.childPublicId
    })

    if (!financialTransactionFile) {
      throw new BadRequestException('There is no file with given id in the organization')
    }
    try {
      const fileStream = await this.filesService.getTransactionAttachmentStream(financialTransactionFile.key)
      return {
        fileStream,
        financialTransactionFile: FinancialTransactionFileDto.map(financialTransactionFile)
      }
    } catch (e) {
      throw new InternalServerErrorException('Error while getting file stream', e.message)
    }
  }

  async getFiles(param: { organizationId: string; childPublicId: string }) {
    try {
      const financialTransactionFiles = await this.financialTransactionsEntityService.getAllFiles({
        organizationId: param.organizationId,
        childPublicId: param.childPublicId
      })
      return financialTransactionFiles.map((file) => FinancialTransactionFileDto.map(file))
    } catch (e) {
      this.logger.error(`Error while getting files for organization ${param.organizationId}`, e, param)
      throw new InternalServerErrorException('Error while getting file stream', e.message)
    }
  }

  async deleteFile(param: { organizationId: string; childPublicId: string; publicFileId: string }) {
    const financialTransactionFile = await this.financialTransactionsEntityService.getFileByOrganizationIdAndPublicId({
      organizationId: param.organizationId,
      publicId: param.publicFileId,
      childPublicId: param.childPublicId
    })

    if (!financialTransactionFile) {
      throw new BadRequestException('There is no file with given id in the organization')
    }
    const result = await this.financialTransactionsEntityService.softDeleteFile(financialTransactionFile.id)
    return !!result.affected
  }
}
