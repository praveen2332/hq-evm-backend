// implement unit tests for AlchemyAdapter using jest

import { FeatureMapType } from '../types/feature-key.type'
import { alchemyClientMock } from '../../../test/mock/alchemy-client.mock'

describe('AlchemyAdapter', () => {
  const keys: FeatureMapType = {
    INGESTION: 'foo'
  }
  const getAlchemyClientMock = jest.fn().mockReturnValue(alchemyClientMock)

  beforeEach(() => {
    jest.mock('./alchemy.utils', () => ({
      alchemyUtils: {
        getAlchemyClient: getAlchemyClientMock,
        getNetworkByChainId: jest.fn()
      }
    }))
  })

  it('should be defined', async () => {
    const Alchemy = require('./alchemy.adapter')

    const adapter = new Alchemy.AlchemyAdapter(keys, 1)
    const result = await adapter.getTransactionsByAddress('0x123', {
      direction: 'to',
      fromBlock: '0x0',
      nextPageId: 'foo'
    })
  })
})
