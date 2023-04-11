import { MigrationInterface, QueryRunner } from 'typeorm'
import { ERole } from '../roles/interfaces'

const permissions = {
  [ERole.Owner]: [{ action: 'manage', subject: 'all' }],
  [ERole.Admin]: [
    { action: 'create', subject: 'Transaction' },
    { action: 'read', subject: 'Transaction' },
    { action: 'update', subject: 'Transaction', conditions: { approverId: '${account.id}' } },
    { action: 'delete', subject: 'Transaction' },
    { action: 'create', subject: 'Account' },
    { action: 'read', subject: 'Account' },
    { action: 'update', subject: 'Account' },
    { action: 'delete', subject: 'Account' },
    { action: 'create', subject: 'Group' },
    { action: 'read', subject: 'Group' },
    { action: 'update', subject: 'Group' },
    { action: 'delete', subject: 'Group' },
    { action: 'read', subject: 'SourceOfFund' }
  ],
  [ERole.Employee]: [
    { action: 'read', subject: 'Transaction', conditions: { receiverId: '${account.id}' } },
    { action: 'update', subject: 'Account', conditions: { id: '${account.id}' } },
    { action: 'read', subject: 'Account', conditions: { id: '${account.id}' } }
  ],
  [ERole.Vendor]: [
    { action: 'read', subject: 'Transaction', conditions: { receiverId: '${account.id}' } },
    { action: 'update', subject: 'Account', conditions: { id: '${account.id}' } },
    { action: 'read', subject: 'Account', conditions: { id: '${account.id}' } }
  ],
  [ERole.Auditor]: [
    { action: 'read', subject: 'Transaction' },
    { action: 'update', subject: 'Transaction' },
    { action: 'update', subject: 'Account', conditions: { id: '${account.id}' } },
    { action: 'read', subject: 'Account', conditions: { id: '${account.id}' } }
  ],
  [ERole.BillingManager]: [
    { action: 'update', subject: 'Account', conditions: { id: '${account.id}' } },
    { action: 'read', subject: 'Account', conditions: { id: '${account.id}' } },
    { action: 'manage', subject: 'Billing' }
  ]
}

const chains = [
  {
    id: 1,
    name: 'Ethereum',
    isTestnet: false,
    tokens: []
  },
  {
    id: 3,
    name: 'Ropsten',
    isTestnet: true,
    tokens: []
  },
  {
    id: 4,
    name: 'Rinkeby',
    isTestnet: true,
    tokens: []
  },
  {
    id: 42,
    name: 'Kovan',
    isTestnet: true,
    tokens: []
  },
  {
    id: 6284,
    name: 'Goerli',
    isTestnet: true,
    tokens: []
  }
]

const tokens = [
  {
    name: 'ETH'
  },
  {
    name: 'USDT'
  },
  {
    name: 'BNB'
  },
  {
    name: 'USDC'
  },
  {
    name: 'HEX'
  },
  {
    name: 'LUNA'
  },
  {
    name: 'UST'
  },
  {
    name: 'BUSD'
  },
  {
    name: 'SHIB'
  },
  {
    name: 'DAI'
  }
]

export class SeedData1662394168906 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const key of Object.keys(ERole)) {
      const roleName = ERole[key]
      queryRunner.query(
        `INSERT INTO "role"("created_at", "updated_at", "deleted_at", "name", "permissions") VALUES (DEFAULT, DEFAULT, DEFAULT, '${roleName}', '${JSON.stringify(
          permissions[roleName]
        )}')`
      )
    }

    for (const token of tokens) {
      queryRunner.query(
        `INSERT INTO "token"("name", "createdAt", "updatedAt", "deletedAt") VALUES ('${token.name}', DEFAULT, DEFAULT, DEFAULT)`
      )
    }

    for (const chain of chains) {
      queryRunner.query(
        `INSERT INTO "chain"("id", "name", "isTestnet", "createdAt", "updatedAt", "deletedAt") VALUES (${chain.id}, '${
          chain.name
        }', ${chain.isTestnet ? 'TRUE' : 'FALSE'}, DEFAULT, DEFAULT, DEFAULT)`
      )
    }

    for (const [index] of tokens.entries()) {
      for (const chain of chains) {
        queryRunner.query(`INSERT INTO "supported_tokens"("tokenId", "chainId") VALUES (${index + 1}, ${chain.id})`)
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: implement rollback
  }
}
