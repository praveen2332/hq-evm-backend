import { Column, Entity } from 'typeorm'
import { PublicEntity } from '../../../core/entities/base.entity'

@Entity()
export class Country extends PublicEntity {
  @Column()
  name: string
  @Column()
  iso: string
  @Column()
  iso3: string
}
