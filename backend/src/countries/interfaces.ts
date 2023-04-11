import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty } from 'class-validator'
import { Country } from '../common/services/countries/country.entity'

export class CountryDto {
  @ApiProperty({ example: 'f290353a-9607-4c90-9aef-78b1330a98a5' })
  @IsNotEmpty()
  id: string

  @ApiProperty({ example: 'Singapore' })
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 'SG' })
  @IsNotEmpty()
  iso: string

  @ApiProperty({ example: 'SGP' })
  @IsNotEmpty()
  iso3: string

  public static map(country: Country): CountryDto {
    const walletGroupDto = new CountryDto()
    walletGroupDto.id = country.publicId
    walletGroupDto.name = country.name
    walletGroupDto.iso = country.iso
    walletGroupDto.iso3 = country.iso3
    return walletGroupDto
  }
}
