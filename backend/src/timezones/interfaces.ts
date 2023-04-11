import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { Timezone } from '../common/services/timezones/timezone.entity'

export class TimezoneDto {
  @ApiProperty({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  @IsNotEmpty()
  id: string

  @ApiProperty({ example: 'Asia/Singapore' })
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '+8' })
  @IsNotEmpty()
  abbrev: string

  @ApiProperty({ example: 480 })
  @IsNotEmpty()
  utcOffset: number

  public static map(country: Timezone): TimezoneDto {
    const walletGroupDto = new TimezoneDto()
    walletGroupDto.id = country.publicId
    walletGroupDto.name = country.name
    walletGroupDto.abbrev = country.abbrev
    walletGroupDto.utcOffset = country.utcOffset
    return walletGroupDto
  }
}
