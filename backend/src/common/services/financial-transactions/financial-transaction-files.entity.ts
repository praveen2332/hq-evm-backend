import { Column, Entity } from 'typeorm'
import { PublicEntity } from '../../../core/entities/base.entity'

@Entity()
export class FinancialTransactionFile extends PublicEntity {
  @Column()
  name: string

  @Column({ name: 'mime_type' })
  mimeType: string

  @Column()
  size: number

  @Column({ name: 'file_path' })
  filePath: string

  @Column({ name: 'key' })
  key: string

  @Column({ name: 'financial_transaction_child_id' })
  financialTransactionChildId: string

  @Column({ name: 'organization_id' })
  organizationId: string

  static create(params: {
    file: {
      originalname: string
      mimetype: string
      size: number
    }
    financialTransactionChildId: string
    organizationId: string
    filePath: string
    key: string
  }): FinancialTransactionFile {
    const financialTransactionFile = new FinancialTransactionFile()
    financialTransactionFile.name = params.file.originalname
    financialTransactionFile.mimeType = params.file.mimetype
    financialTransactionFile.size = params.file.size
    financialTransactionFile.filePath = params.filePath
    financialTransactionFile.key = params.key
    financialTransactionFile.financialTransactionChildId = params.financialTransactionChildId
    financialTransactionFile.organizationId = params.organizationId
    return financialTransactionFile
  }
}
