import { Column, Entity, Generated, OneToMany } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'
import { CryptocurrencyAddress } from './cryptocurrency-address.entity'

@Entity()
export class Cryptocurrency extends BaseEntity {
  @Column()
  name: string

  @Column({ name: 'public_id', type: 'uuid', unique: true })
  @Generated('uuid')
  publicId: string

  @Column()
  symbol: string

  @OneToMany(() => CryptocurrencyAddress, (cryptocurrencyAddress) => cryptocurrencyAddress.cryptocurrency)
  addresses: CryptocurrencyAddress[]

  @Column({ name: 'coingecko_id' })
  coingeckoId: string

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean

  @Column({ type: 'json', nullable: true })
  image: CryptocurrencyImage

  static create(params: {
    name: string
    symbol: string
    coingeckoId: string
    isVerified: boolean
    image: CryptocurrencyImage
  }): Cryptocurrency {
    const cryptocurrency = new Cryptocurrency()
    cryptocurrency.name = params.name
    cryptocurrency.symbol = params.symbol
    cryptocurrency.coingeckoId = params.coingeckoId
    cryptocurrency.isVerified = params.isVerified
    cryptocurrency.image = params.image ?? null

    return cryptocurrency
  }
}

export interface CryptocurrencyImage {
  thumb?: string
  small?: string
  large?: string
}
