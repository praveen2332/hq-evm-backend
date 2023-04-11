import { CategoryType } from '../../categories/interfaces'

export const SignMessage = 'Logging into hq.xyz. This will give you access to all safes owned by this account.'

export const CoingeckoApiUrl = 'https://pro-api.coingecko.com/api/v3'

export enum PostgresErrorCode {
  UniqueViolation = '23505',
  CheckViolation = '23514',
  NotNullViolation = '23502',
  ForeignKeyViolation = '23503'
}

export const INVITATION_EXPIRED = 24 // hour
export const MAX_RETRIES = 6
export const ONE_HOUR_IN_MS = 60 * 60 * 1000

export const GnosisService = {
  ethereum: 'https://safe-transaction.mainnet.gnosis.io/api',
  goerli: 'https://safe-transaction-goerli.safe.global/api',
  polygon: 'https://safe-transaction.polygon.gnosis.io/api',
  bsc: 'https://safe-transaction.bsc.gnosis.io/api'
}

export const ETHEREUM_CHAIN_ID = 1
export const GOERLI_CHAIN_ID = 5
export const POLYGON_CHAIN_ID = 137
export const BSC_CHAIN_ID = 56

// export const SupportedChains = ['ethereum', 'rinkeby', 'polygon', 'bsc']
export const SupportedChains = ['ethereum', 'goerli']

export const ChainIds = {
  [ETHEREUM_CHAIN_ID]: 'ethereum',
  [GOERLI_CHAIN_ID]: 'goerli',
  [POLYGON_CHAIN_ID]: 'polygon'
  // [BSC_CHAIN_ID]: 'bsc'
}

export const ScanAPIs = {
  ethereum: 'https://api.etherscan.io/api',
  goerli: 'https://api-goerli.etherscan.io/api',
  polygon: 'https://api.polygonscan.com/api',
  bsc: 'https://api.bscscan.com/api'
}

export const SupportedTokens: { [symbol: string]: { symbol: string; id: string; decimals: number } } = {
  ETH: { symbol: 'ETH', id: 'ethereum', decimals: 18 },
  MATIC: { symbol: 'MATIC', id: 'matic-network', decimals: 18 },
  USDC: { symbol: 'USDC', id: 'usd-coin', decimals: 6 },
  XSGD: { symbol: 'XSGD', id: 'xsgd', decimals: 6 },
  XIDR: { symbol: 'XIDR', id: 'straitsx-indonesia-rupiah', decimals: 6 },
  USDT: { symbol: 'USDT', id: 'tether', decimals: 6 },
  DAI: { symbol: 'DAI', id: 'dai', decimals: 18 },
  //https://github.com/BluejayFinance/assets/blob/main/blu-stables/svg/SGD.svg
  BLUSGD: { symbol: 'BLUSGD', id: 'sgd-tracker', decimals: 18 }
}

export const currencies = ['sgd', 'usd', 'idr', 'hkd', 'eur', 'aed', 'cny', 'inr', 'myr', 'cad', 'gbp', 'chf']
export const MAIN_FIAT_CURRENCY = 'usd'

export const networkConfigs = {
  [ETHEREUM_CHAIN_ID]: {
    tokens: [
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      '0x70e8de73ce538da2beed35d14187f6959a8eca96',
      '0xebf2096e01455108badcbaf86ce30b6e5a72aa52',
      '0xdac17f958d2ee523a2206206994597c13d831ec7',
      '0x6b175474e89094c44da98b954eedeac495271d0f',
      '0x92830ef7c8d651Ed3A708053c602E807bAd7db22'
    ],
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': SupportedTokens.USDC,
    '0x70e8de73ce538da2beed35d14187f6959a8eca96': SupportedTokens.XSGD,
    '0xebf2096e01455108badcbaf86ce30b6e5a72aa52': SupportedTokens.XIDR,
    '0xdac17f958d2ee523a2206206994597c13d831ec7': SupportedTokens.USDT,
    '0x6b175474e89094c44da98b954eedeac495271d0f': SupportedTokens.DAI,
    '0x92830ef7c8d651Ed3A708053c602E807bAd7db22': SupportedTokens.BLUSGD,
    default: SupportedTokens.ETH,
    disperse: '0xd152f549545093347a162dce210e7293f1452150',
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    urlToAddress: (address: string) => `https://etherscan.io/address/${address}`,
    urlToTx: (txHash: string) => `https://etherscan.io/tx/${txHash}`
  },
  [GOERLI_CHAIN_ID]: {
    tokens: [
      '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
      '0x74298183a2a5460b1240ff43cc3c3e8327ea83e6',
      '0xc039e7f1e44384f207948e9ff12e345cab3fa30c',
      '0xac63d1ae50ef9860508d5fc21fcda7aff8db524a',
      '0xf2edf1c091f683e3fb452497d9a98a49cba84666',
      '0x7cA7f84d27f11C3a1c24612b641e4Cca7C2E923B'
    ],
    '0x07865c6e87b9f70255377e024ace6630c1eaa37f': SupportedTokens.USDC,
    '0x74298183a2a5460b1240ff43cc3c3e8327ea83e6': SupportedTokens.XSGD,
    '0xc039e7f1e44384f207948e9ff12e345cab3fa30c': SupportedTokens.XIDR,
    '0xac63d1ae50ef9860508d5fc21fcda7aff8db524a': SupportedTokens.USDT,
    '0xf2edf1c091f683e3fb452497d9a98a49cba84666': SupportedTokens.DAI,
    '0x7cA7f84d27f11C3a1c24612b641e4Cca7C2E923B': SupportedTokens.BLUSGD,
    default: SupportedTokens.ETH,
    disperse: '0xd152f549545093347a162dce210e7293f1452150',
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    urlToAddress: (address: string) => `https://goerli.etherscan.io/address/${address}`,
    urlToTx: (txHash: string) => `https://goerli.etherscan.io/tx/${txHash}`
  },
  [POLYGON_CHAIN_ID]: {
    tokens: ['0x2791bca1f2de4661ed88a30c99a7a9449aa84174', '0x769434dca303597c8fc4997bf3dab233e961eda2'],
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': SupportedTokens.USDC,
    '0x769434dca303597c8fc4997bf3dab233e961eda2': SupportedTokens.XSGD,
    default: SupportedTokens.MATIC,
    disperse: '0xd152f549545093347a162dce210e7293f1452150',
    rpcUrl: 'https://polygon-rpc.com',
    urlToAddress: (address: string) => `https://polygonscan.com/address/${address}`,
    urlToTx: (txHash: string) => `https://polygonscan.com/tx/${txHash}`
  }
  // [BSC_CHAIN_ID]: {
  //   tokens: [
  //     '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'
  //   ],
  //   '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': {
  //     id: 'usd-coin',
  //     symbol: 'USDC',
  //     decimals: 6
  //   },
  //   default: {
  //     id: 'binancecoin',
  //     symbol: 'BNB',
  //     decimals: 18
  //   },
  //   disperse: '0xd152f549545093347a162dce210e7293f1452150',
  //   rpcUrl: 'https://bsc-dataseed.binance.org',
  // }
}

export const DisperseABI = [
  {
    constant: false,
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'values', type: 'uint256[]' }
    ],
    name: 'disperseTokenSimple',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipients', type: 'address[]' },
      { name: 'values', type: 'uint256[]' }
    ],
    name: 'disperseToken',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: 'recipients', type: 'address[]' },
      { name: 'values', type: 'uint256[]' }
    ],
    name: 'disperseEther',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function'
  }
]

export const Erc20ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      { internalType: 'uint8', name: 'decimals', type: 'uint8' }
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'spender', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    constant: true,
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'subtractedValue', type: 'uint256' }
    ],
    name: 'decreaseAllowance',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'addedValue', type: 'uint256' }
    ],
    name: 'increaseAllowance',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'uint256', name: '_amount', type: 'uint256' }
    ],
    name: 'mint',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { internalType: 'address', name: 'sender', type: 'address' },
      { internalType: 'address', name: 'recipient', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' }
    ],
    name: 'transferFrom',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  }
]

export const systemCategories = [
  {
    name: 'Sales',
    type: CategoryType.REVENUE,
    code: '200',
    descrition: 'Income from any normal business activity'
  },
  {
    name: 'Interest Income',
    type: CategoryType.REVENUE,
    code: '270',
    descrition: 'Interest income from amount paid to the business for lending or letting another entity use its funds'
  },
  {
    name: 'Other Income',
    type: CategoryType.REVENUE,
    code: '260',
    descrition: `Income that does not come from a company’s main business, such as rental income.`
  },
  {
    name: 'Refunds',
    type: CategoryType.REVENUE,
    code: '280',
    descrition: 'Repayment of funds from an original payee to the business'
  },
  {
    name: 'Reimbursement',
    type: CategoryType.REVENUE,
    code: '290',
    descrition: 'Reimbursement of funds from another entity for payments made by the business'
  },
  {
    name: 'Advertising & Marketing',
    type: CategoryType.EXPENSE,
    code: '400',
    descrition: 'Expenses incurred for advertising while trying to increase sales'
  },
  {
    name: 'Entertainment',
    type: CategoryType.REVENUE,
    code: '420',
    descrition: 'Expenses paid by company for the business but are not deductable for income tax purposes.'
  },
  {
    name: 'Office Expenses',
    type: CategoryType.EXPENSE,
    code: '453',
    descrition:
      'General expenses related to the running of the business office (e.g. Stationeries/Office Cleaning/Office Pantry)'
  },
  {
    name: 'General Expenses',
    type: CategoryType.EXPENSE,
    code: '429',
    descrition: 'General expenses related to the running of the business (e.g. Liability Insurance)'
  },
  {
    name: 'Vendor/Supplier Expenses',
    type: CategoryType.EXPENSE,
    code: '412',
    descrition: 'Expenses related to paying consultants'
  },
  {
    name: 'Rent',
    type: CategoryType.EXPENSE,
    code: '469',
    descrition: 'The payment to lease a building or area.'
  },
  {
    name: 'Subscriptions',
    type: CategoryType.EXPENSE,
    code: '485',
    descrition: 'Expenses related to subscriptions e.g. Publications/Software Subscriptions'
  },
  {
    name: 'Utilities',
    type: CategoryType.EXPENSE,
    code: '445',
    descrition: 'Expenses related to common utilities e.g. Telephone/Internet/Electricity/Water'
  },
  {
    name: 'Training',
    type: CategoryType.EXPENSE,
    code: '460',
    descrition: 'Expenses related to training employees for business needs'
  },
  {
    name: 'Travel - International',
    type: CategoryType.EXPENSE,
    code: '493',
    descrition: 'Expenses incurred from international travel which has a business purpose'
  },
  {
    name: 'Local Transport',
    type: CategoryType.EXPENSE,
    code: '494',
    descrition: 'Expenses incurred from local travel which has a business purpose'
  },
  {
    name: 'Wages & Salaries',
    type: CategoryType.EXPENSE,
    code: '477',
    descrition: 'Payment to employees in exchange for their resources'
  },
  {
    name: 'Transaction Fees',
    type: CategoryType.EXPENSE,
    code: '405',
    descrition: 'Fees charged for transactions made by business wallets/accounts'
  },
  {
    name: 'Other Contract Interaction Fee',
    type: CategoryType.EXPENSE,
    code: '406',
    descrition: 'Fees paid to interact with contracts e.g. Setting Spend Limit Approvals/Rebase Staking'
  },
  {
    name: 'Crypto Swap Fee',
    type: CategoryType.EXPENSE,
    code: '407',
    descrition: 'Fees Paid for Crypto Swaps'
  },
  {
    name: 'Off-ramp fee',
    type: CategoryType.EXPENSE,
    code: '408',
    descrition: 'Fees Paid for off-ramp'
  }
]
