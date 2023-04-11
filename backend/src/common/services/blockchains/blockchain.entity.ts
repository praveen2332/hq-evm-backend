import { Column, Entity } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'

@Entity()
export class Blockchain extends BaseEntity {
  @Column({ name: 'public_id', unique: true })
  publicId: string

  @Column()
  name: string

  @Column({ name: 'chain_id', nullable: true })
  chainId: string

  @Column({ name: 'is_enabled' })
  isEnabled: boolean

  @Column({ name: 'is_testnet' })
  isTestnet: boolean

  @Column({ name: 'block_explorer', nullable: true })
  blockExplorer: string

  @Column({ name: 'api_url', nullable: true })
  apiUrl: string

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string
}
