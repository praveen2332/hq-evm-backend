import { HttpService } from '@nestjs/axios'
import {
  Body,
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import * as archiver from 'archiver'
import { format } from 'date-fns'
import { Response } from 'express'
import { lastValueFrom, map, retry } from 'rxjs'
import { In } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CategoriesService } from '../categories/categories.service'
import { GnosisService, ScanAPIs } from '../common/constants'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { AccountsService } from '../common/services/account/accounts.service'
import { SupportedBlockchains } from '../common/services/blockchains/interfaces'
import { ChainsService } from '../common/services/chains/chains.service'
import { RecipientsService } from '../common/services/contacts/recipients.service'
import { Token } from '../common/services/tokens/token.entity'
import { PaginationResponse } from '../core/interfaces'
import { Action, Resource } from '../permissions/interfaces'
import { SchedulesService } from '../schedules/schedules.service'
import { SourceType } from '../source-of-funds/interfaces'
import { SourceEthService } from '../source-of-funds/source-eth-eoa/source-eth-eoa.service'
import { SourceGnosisService } from '../source-of-funds/source-gnosis/source-gnosis.service'
import { SourceOfFund, SourceOfFundGnosis } from '../source-of-funds/source-of-fund.entity'
import { SourceOfFundsService } from '../source-of-funds/source-of-funds.service'
import { sortByName } from '../utils/utils'
import {
  CreateTransactionDto,
  ETransactionType,
  SyncTransactionDto,
  TransactionExportCSVQueryParams,
  TransactionQueryParams,
  UpdateTransactionDto
} from './interfaces'
import { Transaction } from './transaction.entity'
import { TransactionsService } from './transactions.service'

@ApiTags('transactions')
@ApiBearerAuth()
@RequirePermissionResource(Resource.TRANSACTIONS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private sourceOfFundsService: SourceOfFundsService,
    private sourceGnosisService: SourceGnosisService,
    private sourceEthService: SourceEthService,
    private chainsService: ChainsService,
    private recipientsService: RecipientsService,
    private accountsService: AccountsService,
    private categoriesService: CategoriesService,
    private schedulesService: SchedulesService,
    private httpService: HttpService
  ) {}

  @Get('sources')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Param('organizationId') organizationId: string, @Query() query: TransactionQueryParams) {
    const sources = await this.sourceOfFundsService.find({
      where: { organization: { publicId: organizationId } },
      relations: ['organization']
    })
    if (!sources.length) {
      return {
        totalItems: 0,
        totalPages: 0,
        currentPage: query.page,
        items: 0,
        limit: query.size || 10
      }
    }

    const currentSources = await this.getSources(sources)
    return this.transactionsService.getTransactions(currentSources, query)
  }

  private async getSources(sources: SourceOfFund[]): Promise<SourceOfFund[]> {
    //TODO: make this immutable
    for (const source of sources) {
      if (source.sourceType === SourceType.GNOSIS) {
        const gnosis = await this.sourceGnosisService.get(source.sourceId)
        const temp: SourceOfFundGnosis = source
        if (gnosis) {
          temp.address = gnosis.address
          temp.blockchainId = gnosis.blockchainId
        }
      }
      if (source.sourceType === SourceType.ETH) {
        const eth = await this.sourceEthService.get(source.sourceId)
        const temp: SourceOfFundGnosis = source
        if (eth) {
          temp.address = eth.address
          temp.blockchainId = eth.blockchainId
        }
      }
    }

    return sources
  }

  @Get('filter/:chainId')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'chainId', type: 'number' })
  async getFromFilters(@Param('organizationId') organizationId: string, @Param('blockchainId') blockchainId: string) {
    const sources = await this.sourceOfFundsService.find({
      where: { organization: { publicId: organizationId } },
      relations: ['organization']
    })

    const sourceList: { name: string; address: string; blockchainId: string }[] = []
    const currentSources: SourceOfFundGnosis[] = await this.getSources(sources)
    if (currentSources)
      for (const source of currentSources) {
        sourceList.push({ name: source.name, address: source.address, blockchainId: source.blockchainId })
      }

    const recipientList: { name: string; address: string; blockchainId: string; token: Token }[] = []
    const recipients = await this.recipientsService.find({
      where: { organization: { publicId: organizationId } },
      relations: ['recipientAddresses', 'recipientContacts', 'recipientAddresses.token']
    })
    if (recipients)
      for (const recipient of recipients) {
        const recipientAddresses = recipient.recipientAddresses
        for (const recipientAddress of recipientAddresses) {
          recipientList.push({
            name: recipient.organizationName || recipient.contactName,
            address: recipientAddress.address,
            blockchainId: recipientAddress.blockchainId,
            token: recipientAddress.token
          })
        }
      }
    const recipientsInTransaction: { address: string }[] = []
    const sendersInTransaction: { address: string }[] = []

    const transactions = await this.transactionsService.getAllTransactions(currentSources, blockchainId)
    if (transactions)
      for (const transaction of transactions) {
        if (transaction && transaction.recipients && transaction.recipients.length) {
          for (const recipient of transaction.recipients) {
            const isExistedAddress = recipientsInTransaction.find(
              (recipientItem) =>
                recipientItem.address && recipientItem.address.toLowerCase() === recipient.address.toLowerCase()
            )
            const isExistedInRecipients = recipientList.find(
              (recipientItem) =>
                recipientItem.address && recipientItem.address.toLowerCase() === recipient.address.toLowerCase()
            )
            const isExistedInSourceOfFund = sourceList.find(
              (recipientItem) =>
                recipientItem.address && recipientItem.address.toLowerCase() === recipient.address.toLowerCase()
            )
            if (!isExistedAddress && !isExistedInRecipients && !isExistedInSourceOfFund) {
              recipientsInTransaction.push({
                address: recipient.address
              })
            }
          }
          const sender =
            (transaction.safeTransaction && transaction.safeTransaction.from) ||
            (transaction.metamaskTransaction && transaction.metamaskTransaction.from)

          if (sender) {
            const existedInSourceOfFund = sourceList.find(
              (recipientItem) => recipientItem.address && recipientItem.address.toLowerCase() === sender.toLowerCase()
            )
            const existedAddress = sendersInTransaction.find(
              (recipientItem) => recipientItem.address && recipientItem.address.toLowerCase() === sender.toLowerCase()
            )

            const recipient = recipientList.find(
              (recipientItem) => recipientItem.address.toLowerCase() === sender.toLowerCase()
            )
            if (!existedAddress) {
              if (recipient) {
                sendersInTransaction.push(recipient)
              } else if (!existedInSourceOfFund) {
                sendersInTransaction.push({ address: sender })
              }
            }
          }
        }
      }
    return {
      from: sortByName(sourceList).concat(sortByName(sendersInTransaction)),
      to: sortByName(recipientList).concat(sortByName(sourceList)).concat(recipientsInTransaction)
    }
  }

  @Get('sources/:sourceId')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'sourceId', type: 'string' })
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getSourceTransactions(
    @Param('organizationId') organizationId: string,
    @Param('sourceId') sourceId: string,
    @Query() query: TransactionQueryParams
  ) {
    const source = await this.sourceOfFundsService.findOne({
      where: { organization: { publicId: organizationId }, id: sourceId },
      relations: ['organization']
    })
    if (!source || (source.sourceType !== SourceType.GNOSIS && source.sourceType !== SourceType.ETH)) {
      throw new NotFoundException('Source is not exist')
    }

    if (source.sourceType === SourceType.GNOSIS) {
      const gnosis = await this.sourceGnosisService.get(source.sourceId)
      const temp: SourceOfFundGnosis = source
      temp.address = gnosis ? gnosis.address : ''
      temp.blockchainId = gnosis ? gnosis.blockchainId : SupportedBlockchains.GOERLI
    }
    if (source.sourceType === SourceType.ETH) {
      const eth = await this.sourceEthService.get(source.sourceId)
      const temp: SourceOfFundGnosis = source
      temp.address = eth ? eth.address : ''
    }
    return this.transactionsService.getSourceTransactions(source, query)
  }

  @Post('sync')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Transaction })
  async sync(
    @Param('organizationId') organizationId: string,
    @Body(new ValidationPipe()) syncTransactionDto: SyncTransactionDto,
    @Req() req
  ) {
    let transaction = await this.transactionsService.findOne({
      where: { safeHash: syncTransactionDto.safeHash, source: { id: syncTransactionDto.sourceId } },
      relations: ['source', 'categories']
    })
    if (syncTransactionDto.isExecuted && transaction) {
      transaction.hash = syncTransactionDto.hash
      transaction.isExecuted = syncTransactionDto.isExecuted
      transaction.safeTransaction.isExecuted = syncTransactionDto.isExecuted
      transaction.recipients = syncTransactionDto.recipients
      transaction.timeStamp = new Date()
      transaction.type = ETransactionType.OUTGOING
      await this.transactionsService.create(transaction)
      return true
    }
    let categories = (transaction && transaction.categories) || []
    let comment = (transaction && transaction.comment) || ''
    let files = (transaction && transaction.files) || []

    const oldTransaction = await this.transactionsService.getTransactionByNonce(syncTransactionDto)
    if (oldTransaction) {
      categories = oldTransaction.categories
      comment = oldTransaction.comment
      files = oldTransaction.files
      await this.transactionsService.remove(oldTransaction)
    }

    if (!transaction) {
      transaction = new Transaction()
      transaction.blockchainId = syncTransactionDto.blockchainId
      transaction.source = await this.sourceOfFundsService.get(syncTransactionDto.sourceId)
    }
    try {
      const url = `${GnosisService[syncTransactionDto.blockchainId]}/v1/safes/${
        syncTransactionDto.sourceAddress
      }/multisig-transactions?safe_tx_hash=${syncTransactionDto.safeHash}`

      this.httpService
        .get(url)
        .pipe(
          map((val) => {
            if (syncTransactionDto.safeHash && !val.data.results.length) {
              throw val
            }

            return val
          }),
          retry({ delay: 5000 })
        )
        .subscribe({
          next: (res) => {
            transaction.safeTransaction = {
              ...res.data.results[0],
              confirmationsRequired: syncTransactionDto.confirmationsRequired
            }
            transaction.safeHash = syncTransactionDto.safeHash
            transaction.recipients = syncTransactionDto.recipients
            transaction.symbol = syncTransactionDto.symbol
            transaction.hash = uuidv4()
            transaction.isExecuted = res.data.results[0].isExecuted
            transaction.categories = categories
            transaction.files = files
            transaction.comment = comment
            transaction.timeStamp = res.data.results[0].executionDate
              ? new Date(res.data.results[0].executionDate)
              : null
            transaction.type = ETransactionType.QUEUE
            transaction.submissionDate = new Date(res.data.results[0].submissionDate)
            this.transactionsService.create(transaction)
          },
          error: (error) => {
            console.log(error)
          }
        })
      return true
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  // TODO: Why do we have create transactions API?
  @Post(':sourceId')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'sourceId', type: 'string' })
  @ApiResponse({ status: 200, type: Transaction })
  async create(
    @Param('organizationId') organizationId: string,
    @Param('sourceId') sourceId: string,
    @Body(new ValidationPipe()) createTransactionDto: CreateTransactionDto,
    @Req() req
  ) {
    const source = await this.sourceOfFundsService.findOne({
      where: { organization: { publicId: organizationId }, id: sourceId }
    })
    if (
      !source ||
      (source.sourceType !== SourceType.GNOSIS &&
        source.sourceType !== SourceType.ETH &&
        source.sourceType !== SourceType.FTX)
    ) {
      throw new NotFoundException('Source is not exist')
    }
    try {
      const transaction = new Transaction()
      transaction.blockchainId = createTransactionDto.blockchainId
      transaction.hash = createTransactionDto.hash || uuidv4()
      transaction.safeHash = createTransactionDto.safeHash
      transaction.comment = createTransactionDto.comment
      transaction.source = source
      transaction.txCreator = await this.accountsService.get(req.user.accountId)
      transaction.isDraft = createTransactionDto.isDraft
      transaction.categories = await this.categoriesService.find({ where: { id: In(createTransactionDto.categories) } })
      transaction.draftTransaction = createTransactionDto.draftTransaction
      transaction.symbol = createTransactionDto.symbol
      transaction.method = createTransactionDto.functionName || ''
      transaction.recipients = createTransactionDto.recipients || []
      transaction.files = createTransactionDto.files || []

      if (transaction.isDraft) {
        transaction.type = ETransactionType.DRAFT
        transaction.isExecuted = false
        transaction.timeStamp = new Date()
        this.transactionsService.create(transaction)
      } else {
        let transactionReceiptUrl: string
        let gasUsed: string
        let url = `${ScanAPIs[createTransactionDto.blockchainId]}?module=proxy&action=eth_getTransactionByHash&txhash=${
          transaction.hash
        }&apikey=${this.schedulesService.getScanApiKey(createTransactionDto.blockchainId)}`
        if (createTransactionDto.safeHash) {
          url = `${GnosisService[createTransactionDto.blockchainId]}/v1/safes/${
            createTransactionDto.sourceAddress
          }/multisig-transactions?safe_tx_hash=${createTransactionDto.safeHash}`
        } else {
          transactionReceiptUrl = `${
            ScanAPIs[createTransactionDto.blockchainId]
          }?module=proxy&action=eth_getTransactionReceipt&txhash=${
            transaction.hash
          }&apikey=${this.schedulesService.getScanApiKey(createTransactionDto.blockchainId)}`
        }

        if (transactionReceiptUrl)
          this.httpService.get(transactionReceiptUrl).subscribe({
            next: (res) => {
              if (res && res.data && res.data.result && res.data.result.gasUsed) {
                gasUsed = res.data.result.gasUsed
              }
            },
            error: (error) => {
              console.log(error)
            }
          })

        this.httpService
          .get(url)
          .pipe(
            map((val) => {
              if (createTransactionDto.safeHash && !val.data.results.length) {
                transaction.type = ETransactionType.QUEUE
                throw val
              }
              transaction.type = ETransactionType.OUTGOING
              return val
            }),
            retry({ delay: 5000 })
          )
          .subscribe({
            next: (res) => {
              if (createTransactionDto.safeHash && res.data.results.length) {
                transaction.safeTransaction = res.data.results[0]
                transaction.isExecuted = res.data.results[0].isExecuted
                transaction.safeTransaction.confirmationsRequired = createTransactionDto.confirmationsRequired
                transaction.timeStamp = res.data.results[0].executionDate
                  ? new Date(res.data.results[0].executionDate)
                  : null
                transaction.submissionDate = new Date(res.data.results[0].submissionDate)
              } else {
                transaction.metamaskTransaction = { ...res.data.result, gasUsed }
                transaction.metamaskTransaction.functionName = createTransactionDto.functionName
                transaction.isExecuted = true
                transaction.timeStamp = new Date()
              }

              this.transactionsService.create(transaction)
            },
            error: (error) => {
              console.log(error)
            }
          })
      }
      return true
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  @Put(':id/info')
  @Post()
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Transaction })
  async updateInfo(@Param('id') id: string, @Body(new ValidationPipe()) updateTransactionDto: UpdateTransactionDto) {
    try {
      const transaction = await this.transactionsService.get(id)
      if (transaction) {
        transaction.categories = await this.categoriesService.find({
          where: { id: In(updateTransactionDto.categories) }
        })
        transaction.files = updateTransactionDto.files
        transaction.comment = updateTransactionDto.comment
        if (updateTransactionDto.draftTransaction) {
          transaction.draftTransaction = updateTransactionDto.draftTransaction
        }
        return this.transactionsService.create(transaction)
      }

      throw new NotFoundException()
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @Post()
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Transaction })
  async update(@Param('id') id: string, @Body(new ValidationPipe()) updateTransactionDto: CreateTransactionDto) {
    try {
      const transaction = await this.transactionsService.get(id)
      if (transaction) {
        transaction.files = updateTransactionDto.files
        transaction.hash = updateTransactionDto.hash
        transaction.safeHash = updateTransactionDto.safeHash
        transaction.comment = updateTransactionDto.comment
        transaction.categories = await this.categoriesService.find({
          where: { id: In(updateTransactionDto.categories) }
        })
        transaction.draftTransaction = updateTransactionDto.draftTransaction
        if (transaction.isDraft) {
          transaction.isExecuted = false
          transaction.timeStamp = new Date()
          await this.transactionsService.create(transaction)
        } else {
          let url = `${
            ScanAPIs[updateTransactionDto.blockchainId]
          }?module=proxy&action=eth_getTransactionByHash&txhash=${
            transaction.hash
          }&apikey=${this.schedulesService.getScanApiKey(updateTransactionDto.blockchainId)}`
          if (updateTransactionDto.safeHash) {
            url = `${GnosisService[updateTransactionDto.blockchainId]}/v1/safes/${
              updateTransactionDto.sourceAddress
            }/multisig-transactions?safe_tx_hash=${updateTransactionDto.safeHash}`
          }

          const res = await lastValueFrom(
            this.httpService.get(url).pipe(
              map((val) => {
                if (updateTransactionDto.safeHash && !val.data.results.length) {
                  throw val
                }

                return val
              }),
              retry({ delay: 5000 })
            )
          )
          if (updateTransactionDto.safeHash && res.data.results.length) {
            transaction.safeTransaction = {
              ...res.data.results[0],
              confirmationsRequired: transaction.safeTransaction.confirmationsRequired
            }
            transaction.isExecuted = res.data.results[0].isExecuted
            transaction.timeStamp = res.data.results[0].executionDate
              ? new Date(res.data.results[0].executionDate)
              : null
            transaction.submissionDate = new Date(res.data.results[0].submissionDate)
          } else {
            transaction.metamaskTransaction = res.data.result
            transaction.isExecuted = true
            transaction.timeStamp = new Date()
          }

          await this.transactionsService.create(transaction)
        }
        return transaction
      }

      throw new NotFoundException()
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  @Get('export')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @Header('Content-Type', 'application/octet-stream')
  async export(
    @Param('organizationId') organizationId: string,
    @Query() query: TransactionExportCSVQueryParams,
    @Res() res: Response
  ) {
    const sources = await this.sourceOfFundsService.find({
      where: { organization: { publicId: organizationId } },
      relations: ['organization']
    })
    const currentSources = await this.getSources(sources)
    const pages = await this.transactionsService.getCSVData(currentSources, query)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })

    const fileName = `HQ_XERO_EXPORT_${format(new Date(), 'dd-MM-yyyy')}`
    res.set({
      'Content-Disposition': `attachment; filename="${fileName}.zip"`
    })
    archive.pipe(res)

    for (const page of pages) {
      const index = pages.indexOf(page)
      const fileContents = Buffer.from(page)
      archive.append(fileContents, { name: `page_${index}.csv` })
    }

    await archive.finalize()
  }
}
