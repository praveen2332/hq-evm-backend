import { Column, Entity } from 'typeorm'
import { PublicEntity } from '../../../core/entities/base.entity'

@Entity()
export class Timezone extends PublicEntity {
  @Column()
  name: string
  @Column()
  abbrev: string
  @Column({ name: 'utc_offset' })
  utcOffset: number
}
