import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BlockExplorersProviderEnum } from '../common/types/block-explorers-provider.enum'
import { AlchemyAdapter } from './alchemy/alchemy.adapter'
import { FeatureMapType } from './types/feature-key.type'

@Injectable()
export class BlockExplorerAdapterFactory {
  constructor(private readonly configService: ConfigService) {}

  getBlockExplorerAdapter(blockExplorer: BlockExplorersProviderEnum, blockchainId: string): AlchemyAdapter {
    switch (blockExplorer) {
      case BlockExplorersProviderEnum.ETHERSCAN:
        throw new Error(`Not implemented yet`)
      case BlockExplorersProviderEnum.ALCHEMY:
        const keys: FeatureMapType = {
          INGESTION: this.configService.get('ALCHEMY_INGESTION_API_KEY')
        }
        return new AlchemyAdapter(keys, blockchainId)
      default:
        throw new Error(`BlockExplorerAdapter not found for ${blockExplorer}`)
    }
  }
}
