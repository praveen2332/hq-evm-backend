import { ApiProperty } from '@nestjs/swagger'
import { Blockchain } from '../common/services/blockchains/blockchain.entity'

export class BlockchainsDetailedDto {
  @ApiProperty({ example: 'ethereum' })
  id: string

  @ApiProperty({
    description: 'Full name of the chain for display purpose',
    example: 'Ethereum Mainnet'
  })
  name: string

  @ApiProperty({ example: '1' })
  chainId: string

  @ApiProperty({ example: true })
  isTestnet: boolean

  @ApiProperty({ example: 'https://etherscan.io/' })
  blockExplorer: string

  @ApiProperty({ example: 'https://api.etherscan.io/' })
  apiUrl: string

  @ApiProperty({
    example: 'https://hq-backend-dev-public.s3.ap-southeast-1.amazonaws.com/blockchain-images/ethereum.png'
  })
  imageUrl: string

  static map(blockchain: Blockchain): BlockchainsDetailedDto {
    const result = new BlockchainsDetailedDto()
    result.id = blockchain.publicId
    result.name = blockchain.name
    result.chainId = blockchain.chainId
    result.isTestnet = blockchain.isTestnet
    result.blockExplorer = blockchain.blockExplorer ?? null
    result.apiUrl = blockchain.apiUrl ?? null
    result.imageUrl = blockchain.imageUrl ?? null

    return result
  }
}
