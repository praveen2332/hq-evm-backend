export const alchemyClientMock = {
  core: {
    getAssetTransfers,
    getTransactionReceipt
  }
}

async function getTransactionReceipt(params: any) {
  return null
}
async function getAssetTransfers(params: any) {
  return {
    transfers: [
      {
        blockNum: '0xd4cdaf',
        uniqueId: '0x0646fc7672c7d7b37f94ca86ae3a984bb4e4e72b10d48df4242047044b05c873:external',
        hash: '0x0646fc7672c7d7b37f94ca86ae3a984bb4e4e72b10d48df4242047044b05c873',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
        value: 0.994,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'ETH',
        category: 'external',
        rawContract: {
          value: '0xdcb65bbcabd0000',
          address: null,
          decimal: '0x12'
        },
        metadata: {
          blockTimestamp: '2022-01-05T15:42:19.000Z'
        }
      },
      {
        blockNum: '0xd4de0e',
        uniqueId: '0x17d3cbea12e6dcb3e408b8019fa30939851a66417f155c4ca94c69309017d66c:external',
        hash: '0x17d3cbea12e6dcb3e408b8019fa30939851a66417f155c4ca94c69309017d66c',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
        value: 0.09,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'ETH',
        category: 'external',
        rawContract: {
          value: '0x13fbe85edc90000',
          address: null,
          decimal: '0x12'
        },
        metadata: {
          blockTimestamp: '2022-01-06T07:16:52.000Z'
        }
      },
      {
        blockNum: '0xd4f4e8',
        uniqueId: '0x9f669b9c1ee97574f53861b16651be1557e25da7ddc0ac358b4c80e9e332e19c:external',
        hash: '0x9f669b9c1ee97574f53861b16651be1557e25da7ddc0ac358b4c80e9e332e19c',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0x5192f73b7bdd024155e711e0707c100260a68477',
        value: 0.015,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'ETH',
        category: 'external',
        rawContract: {
          value: '0x354a6ba7a18000',
          address: null,
          decimal: '0x12'
        },
        metadata: {
          blockTimestamp: '2022-01-07T05:08:43.000Z'
        }
      },
      {
        blockNum: '0xd50bc7',
        uniqueId: '0xf24fcfdd09c8ce35cee21e65617ceeed250e7c177492f5da678dcdae03161c8b:log:174',
        hash: '0xf24fcfdd09c8ce35cee21e65617ceeed250e7c177492f5da678dcdae03161c8b',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0x3394f441c36c7c621aa56452add29e26e5c5e75f',
        value: 222294,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'FUR',
        category: 'erc20',
        rawContract: {
          value: '0x036456',
          address: '0x226de3151531ad8f6e4f6bebb1bd010ba25436fc',
          decimal: '0x0'
        },
        metadata: {
          blockTimestamp: '2022-01-08T02:52:18.000Z'
        }
      },
      {
        blockNum: '0xd51cbf',
        uniqueId: '0xfd59f7fd582017ffe86bf09d6313f412f0e0a106667d1aac4668221b278b1469:external',
        hash: '0xfd59f7fd582017ffe86bf09d6313f412f0e0a106667d1aac4668221b278b1469',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        value: 1.5,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'ETH',
        category: 'external',
        rawContract: {
          value: '0x14d1120d7b160000',
          address: null,
          decimal: '0x12'
        },
        metadata: {
          blockTimestamp: '2022-01-08T18:57:10.000Z'
        }
      },
      {
        blockNum: '0xd51ccc',
        uniqueId: '0xcc8b5ca0f1abcc2f7ed9024ed20885636fd8b0d6bad794cad94687979f4ed0e5:log:93',
        hash: '0xcc8b5ca0f1abcc2f7ed9024ed20885636fd8b0d6bad794cad94687979f4ed0e5',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0xc898188b8edc8bc1c04c9846e783e44938110e55',
        value: 1.3,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'WETH',
        category: 'erc20',
        rawContract: {
          value: '0x120a871cc0020000',
          address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          decimal: '0x12'
        },
        metadata: {
          blockTimestamp: '2022-01-08T19:00:49.000Z'
        }
      },
      {
        blockNum: '0xd54daf',
        uniqueId: '0x028d638ed1b08e7513f48a91b273c30d0694a2af860d85ab81fdc1e6ef399d5b:log:41',
        hash: '0x028d638ed1b08e7513f48a91b273c30d0694a2af860d85ab81fdc1e6ef399d5b',
        from: '0x77016474b3fff23611cb827efbadaea44f10637c',
        to: '0x6231e794773e4dc0b1ad79105d850a05d5fc0fcb',
        value: 1500,
        erc721TokenId: null,
        erc1155Metadata: null,
        tokenId: null,
        asset: 'LOOKS',
        category: 'erc20',
        rawContract: {
          value: '0x5150ae84a8cdf00000',
          address: '0xf4d2888d29d722226fafa5d9b24f9164c092421e',
          decimal: '0x12'
        },
        metadata: {
          blockTimestamp: '2022-01-10T17:15:36.000Z'
        }
      }
    ]
  }
}
