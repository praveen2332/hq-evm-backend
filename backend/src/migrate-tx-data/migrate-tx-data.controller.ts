import { Controller, Get, Query } from '@nestjs/common'
import { ApiQuery, ApiTags } from '@nestjs/swagger'
import { TransactionsService } from '../transactions/transactions.service'
import { IsNull, Not } from 'typeorm'
import { FilesService } from '../files/files.service'
import { BucketSelector } from '../files/interfaces'
import { FinancialTransactionsEntityService } from '../common/services/financial-transactions/financial-transactions.entity.service'
import { FinancialTransactionFile } from '../common/services/financial-transactions/financial-transaction-files.entity'
import { LoggerService } from '../common/logger/logger.service'
import { FeatureFlagsService } from '../common/services/feature-flags/feature-flags.service'
import { FeatureFlagOption } from '../common/services/feature-flags/interfaces'

@ApiTags('migrate-tx-data')
@Controller()
export class MigrateTxDataController {
  SECRET = 'mB0246@vjbxk'
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly filesService: FilesService,
    private readonly financialTransactionsEntityService: FinancialTransactionsEntityService,
    private readonly logger: LoggerService,
    private readonly featureFlagsService: FeatureFlagsService
  ) {}

  @Get()
  @ApiQuery({ name: 'secret', type: 'string' })
  async sync(@Query() query: { secret: string }) {
    if (query.secret === this.SECRET) {
      const isFeatureEnabled = await this.featureFlagsService.isFeatureEnabled(
        FeatureFlagOption.FINANCIAL_TRANSACTION_MIGRATION
      )
      if (isFeatureEnabled) {
        await Promise.all([this.migrateFiles(), this.migrateCategories(), this.migrateNotes()])
      }
    }
  }

  async migrateFiles() {
    try {
      const transactions = await this.transactionsService.find({
        where: {
          files: Not(IsNull())
        },
        relations: {
          source: {
            organization: true
          }
        }
      })

      for (const transaction of transactions) {
        if (!transaction.source?.organization?.id) {
          // Source of fund was deleted
          continue
        }
        if (transaction.files?.length) {
          this.logger.log(
            `Transaction ${transaction.hash ?? transaction.safeHash} has ${transaction.files.length} files...`
          )

          const finTxChildren = await this.financialTransactionsEntityService.getChildByHashAndOrganization(
            transaction.hash ?? transaction.safeHash,
            transaction.source.organization.id
          )
          this.logger.log(
            `Transaction ${transaction.hash ?? transaction.safeHash} has ${finTxChildren?.length} children...`
          )
          if (finTxChildren?.length) {
            for (const fileKey of transaction.files) {
              const firstChild = finTxChildren[0]

              const existingFilesForFinTx = await this.financialTransactionsEntityService.getAllFiles({
                organizationId: firstChild.organizationId,
                childPublicId: firstChild.publicId
              })

              if (existingFilesForFinTx.find((f) => f.name === fileKey)) {
                continue
              }

              const s3FileRequest = await this.filesService.getFileS3Response(fileKey)
              const key = this.filesService.getPathToTransactionAttachment({
                organizationId: transaction.source.organization.id,
                childId: firstChild.id
              })
              const s3File = await s3FileRequest.promise()
              const filePath = await this.filesService.uploadToS3(s3File.Body as any, key, BucketSelector.PRIVATE)
              for (const child of finTxChildren) {
                const attachment = FinancialTransactionFile.create({
                  filePath,
                  file: {
                    originalname: fileKey,
                    mimetype: s3File.ContentType,
                    size: s3File.ContentLength
                  },
                  key,
                  financialTransactionChildId: child.id,
                  organizationId: child.organizationId
                })
                const savedFile = await this.financialTransactionsEntityService.saveFile(attachment)
                this.logger.log(`Saved file ${savedFile.id} for child ${child.id}`, {
                  filePath,
                  key
                })
              }
            }
          } else {
            this.logger.log(`Wallet wasn't synched yet for transaction ${transaction.hash ?? transaction.safeHash}`)
          }
        }
      }
    } catch (e) {
      this.logger.error(`Can not migrate files: ${e.message}`, {
        e
      })
    }
  }

  async migrateCategories() {
    try {
      const transactions = await this.transactionsService.find({
        where: {
          categories: {
            id: Not(IsNull())
          }
        },
        relations: {
          source: {
            organization: true
          },
          categories: true
        }
      })

      for (const transaction of transactions) {
        if (!transaction.source?.organization?.id) {
          // Source of fund was deleted
          continue
        }

        const finTxChildren = await this.financialTransactionsEntityService.getChildByHashAndOrganization(
          transaction.hash ?? transaction.safeHash,
          transaction.source.organization.id
        )
        if (finTxChildren?.length) {
          // always is one category
          const category = transaction.categories[0]

          for (const child of finTxChildren) {
            if (child.financialTransactionChildMetadata.category) {
              continue
            }
            await this.financialTransactionsEntityService.updateChildMetadata(
              child.financialTransactionChildMetadata.id,
              {
                category: category
              }
            )
            this.logger.log(`Updated category for child ${child.id} (${child.hash})`, { categoryId: category.id })
          }
        } else {
          this.logger.log(`Wallet wasn't synched yet for transaction ${transaction.hash ?? transaction.safeHash}`)
        }
      }
    } catch (e) {
      this.logger.error(`Can not migrate Categories: ${e.message}`, {
        e
      })
    }
  }

  async migrateNotes() {
    try {
      const transactions = await this.transactionsService.find({
        where: {
          comment: Not(IsNull())
        },
        relations: {
          source: {
            organization: true
          }
        }
      })

      for (const transaction of transactions) {
        if (!transaction.source?.organization?.id) {
          // Source of fund was deleted
          continue
        }

        const finTxChildren = await this.financialTransactionsEntityService.getChildByHashAndOrganization(
          transaction.hash ?? transaction.safeHash,
          transaction.source.organization.id
        )
        if (finTxChildren?.length) {
          for (const child of finTxChildren) {
            if (child.financialTransactionChildMetadata.note !== null) {
              continue
            }
            await this.financialTransactionsEntityService.updateChildMetadata(
              child.financialTransactionChildMetadata.id,
              {
                note: transaction.comment
              }
            )
            this.logger.log(`Updated Notes for child ${child.id} (${child.hash})`)
          }
        } else {
          this.logger.log(`Wallet wasn't synched yet for transaction ${transaction.hash ?? transaction.safeHash}`)
        }
      }
    } catch (e) {
      this.logger.error(`Can not migrate Notes: ${e.message}`, {
        e
      })
    }
  }
}
