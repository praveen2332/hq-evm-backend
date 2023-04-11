import { Alchemy, Network } from 'alchemy-sdk'
import { SupportedBlockchains } from '../../common/services/blockchains/interfaces'

export const alchemyUtils = {
  getAlchemyClient,
  getNetworkByChainId
}

export function getAlchemyClient(network: Network, apiKey: string) {
  const settings = {
    apiKey: apiKey,
    network: network
  }
  return new Alchemy(settings)
}

export function getNetworkByChainId(blockchainId: string): Network {
  switch (blockchainId) {
    case SupportedBlockchains.ETHEREUM_MAINNET:
      return Network.ETH_MAINNET
    case SupportedBlockchains.GOERLI:
      return Network.ETH_GOERLI
    default:
      throw new Error(`Network not found for chainId ${blockchainId}`)
  }
}
