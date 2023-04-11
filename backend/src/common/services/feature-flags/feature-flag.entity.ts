import { Column, Entity, Unique } from 'typeorm'
import { BaseEntity } from '../../../core/entities/base.entity'

@Entity()
@Unique('UQ_feature_flag_name', ['name'])
export class FeatureFlag extends BaseEntity {
  @Column()
  name: string

  @Column({ name: 'is_enabled', default: false })
  isEnabled: boolean = false
}
