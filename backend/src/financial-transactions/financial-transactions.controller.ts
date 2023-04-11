import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger'
import { ApiOkResponse } from '@nestjs/swagger/dist/decorators/api-response.decorator'
import * as archiver from 'archiver'
import { format } from 'date-fns'
import { Response } from 'express'
import { Readable } from 'stream'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AccountId } from '../common/decorators/accountId/account-id.decorator'
import { ApiMultiFile, ApiOkResponsePaginated } from '../common/decorators/api.decorator'
import { OrganizationId } from '../common/decorators/organization-id/organization-id.decorator'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { PaginationResponse } from '../core/interfaces'
import { Action, Resource } from '../permissions/interfaces'
import { FinancialTransactionsDomainService } from './financial-transactions.domain.service'
import {
  FinancialTransactionDto,
  FinancialTransactionFileDto,
  FinancialTransactionParentDetailDto,
  FinancialTransactionQueryExportParams,
  FinancialTransactionQueryParams,
  FinancialTransactionUpdateDto
} from './interfaces'
import { FileSizeValidationPipe } from '../common/pipes/file-size-validation.pipe'

@ApiTags('financial-transactions')
@ApiBearerAuth()
@RequirePermissionResource(Resource.FINANCIAL_TRANSACTIONS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class FinancialTransactionsController {
  constructor(private financialTransactionsDomainService: FinancialTransactionsDomainService) {}

  @Get('')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponsePaginated(FinancialTransactionDto)
  async getAll(
    @OrganizationId() organizationId: string,
    @Query() query: FinancialTransactionQueryParams
  ): Promise<PaginationResponse<FinancialTransactionDto>> {
    return this.financialTransactionsDomainService.getAllPaging(organizationId, query)
  }

  @Get('xero/export')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse()
  @Header('Content-Type', 'application/octet-stream')
  async xeroExport(
    @OrganizationId() organizationId: string,
    @Query() query: FinancialTransactionQueryExportParams,
    @Res() res: Response
  ) {
    const pages = await this.financialTransactionsDomainService.getCSVForExport(organizationId, query)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })

    const fileName = `HQ_XERO_EXPORT_${format(new Date(), 'dd/MM/yyyy')}`
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

  @Get('all/export')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiOkResponse()
  @Header('Content-Type', 'text/csv')
  async csvExport(
    @OrganizationId() organizationId: string,
    @Query() query: FinancialTransactionQueryExportParams,
    @Res() res: Response
  ) {
    const csvString = await this.financialTransactionsDomainService.getTxsCSV(organizationId, query)

    const fileName = `HQTxns_EXPORT_${format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'")}`
    res.set({
      'Content-Disposition': `attachment; filename="${fileName}.csv"`
    })

    const fileContents = Buffer.from(csvString)
    const stream = Readable.from(fileContents)
    stream.pipe(res)
  }

  @Get(':childPublicId/parent/:parentHash')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'childPublicId', type: 'string' })
  @ApiParam({ name: 'parentHash', type: 'string' })
  @ApiOkResponsePaginated(FinancialTransactionDto)
  async getParentDetail(
    @OrganizationId() organizationId: string,
    @Param('childPublicId') childPublicId: string,
    @Param('parentHash') parentHash: string
  ): Promise<FinancialTransactionParentDetailDto> {
    return await this.financialTransactionsDomainService.getParentByHashAndOrganization({
      parentHash,
      organizationId,
      childPublicId
    })
  }

  @Put(':childPublicId')
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'childPublicId', type: 'string' })
  @ApiOkResponsePaginated(FinancialTransactionDto)
  async update(
    @AccountId() accountId: string,
    @OrganizationId() organizationId: string,
    @Param('childPublicId') childPublicId: string,
    @Body() body: FinancialTransactionUpdateDto
  ) {
    return this.financialTransactionsDomainService.update({
      organizationId,
      childPublicId,
      accountId,
      body
    })
  }

  @Post(':childPublicId/files/upload')
  @RequirePermissionAction(Action.UPDATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'childPublicId', type: 'string' })
  @ApiMultiFile('files')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @UploadedFiles(new FileSizeValidationPipe())
    files: Express.Multer.File[],
    @OrganizationId() organizationId: string,
    @Param('childPublicId') childPublicId: string
  ) {
    return this.financialTransactionsDomainService.uploadFiles({
      organizationId,
      childPublicId,
      files
    })
  }

  @Get(':childPublicId/files/:publicFileId/download')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'childPublicId', type: 'string' })
  @ApiParam({ name: 'publicFileId', type: 'string' })
  async downloadFile(
    @OrganizationId() organizationId: string,
    @Param('childPublicId') childPublicId: string,
    @Param('publicFileId') publicFileId: string,
    @Res() res: Response
  ) {
    const { financialTransactionFile, fileStream } = await this.financialTransactionsDomainService.getFileStream({
      organizationId,
      childPublicId,
      publicFileId
    })

    res.set({
      'Content-Type': financialTransactionFile.mimeType,
      'Content-Disposition': `attachment; filename="${financialTransactionFile.name}"`
    })
    fileStream.pipe(res)
  }

  @Delete(':childPublicId/files/:publicFileId')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'childPublicId', type: 'string' })
  @ApiParam({ name: 'publicFileId', type: 'string' })
  async deleteFile(
    @OrganizationId() organizationId: string,
    @Param('childPublicId') childPublicId: string,
    @Param('publicFileId') publicFileId: string
  ) {
    return await this.financialTransactionsDomainService.deleteFile({
      organizationId,
      childPublicId,
      publicFileId
    })
  }

  @Get(':childPublicId/files')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiParam({ name: 'childPublicId', type: 'string' })
  @ApiOkResponse({ type: [FinancialTransactionFileDto] })
  async getFiles(@OrganizationId() organizationId: string, @Param('childPublicId') childPublicId: string) {
    return await this.financialTransactionsDomainService.getFiles({
      organizationId,
      childPublicId
    })
  }
}
