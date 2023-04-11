import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { FeatureFlag } from '../common/services/feature-flags/feature-flag.entity'

export class FeatureFlagDto {
  @ApiProperty({ example: false })
  @IsNotEmpty()
  isEnabled: boolean

  @ApiProperty({ example: 'financial_transaction' })
  @IsNotEmpty()
  name: string

  public static map(featureFlag: FeatureFlag): FeatureFlagDto {
    const featureFlagDto = new FeatureFlagDto()
    featureFlagDto.isEnabled = featureFlag.isEnabled
    featureFlagDto.name = featureFlag.name
    return featureFlagDto
  }
}
