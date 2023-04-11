import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { Cryptocurrency } from './cryptocurrency.entity'
import { CryptocurrencyType } from './interfaces'

@Entity()
@Index('UQ_cryptocurrency_address_chain_type_address', ['type', 'address'], { unique: true })
export class CryptocurrencyAddress extends BaseEntity {
  @ManyToOne(() => Cryptocurrency, (cryptocurrency) => cryptocurrency.addresses)
  @JoinColumn({ name: 'cryptocurrency_id' })
  cryptocurrency: Cryptocurrency

  @Column({ name: 'blockchain_id' })
  blockchainId: string

  @Column({ type: 'enum', enum: CryptocurrencyType })
  type: CryptocurrencyType

  @Column({ nullable: true })
  address: string

  @Column()
  decimal: number

  static create(params: {
    cryptocurrency: Cryptocurrency
    blockchainId: string
    decimal: number
    type: CryptocurrencyType
    address: string
  }): CryptocurrencyAddress {
    const cryptocurrencyAddress = new CryptocurrencyAddress()
    cryptocurrencyAddress.cryptocurrency = params.cryptocurrency
    cryptocurrencyAddress.blockchainId = params.blockchainId
    cryptocurrencyAddress.type = params.type
    cryptocurrencyAddress.address = params.address
    cryptocurrencyAddress.decimal = params.decimal

    return cryptocurrencyAddress
  }
}
