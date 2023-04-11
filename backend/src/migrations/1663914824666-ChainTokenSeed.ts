import { MigrationInterface, QueryRunner } from 'typeorm'

const chains = [
  {
    id: 1,
    name: 'Ethereum',
    isTestnet: false,
    tokens: []
  },
  {
    id: 4,
    name: 'Rinkeby',
    isTestnet: true,
    tokens: []
  }
]

const tokens = [
  // {
  //   id: 1,
  //   name: 'ETH'
  // },
  {
    id: 2,
    name: 'USDC'
  },
  {
    id: 3,
    name: 'XSGD'
  },
  {
    id: 4,
    name: 'XIDR'
  }
]

export class ChainTokenSeed1663914824666 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('UPDATE "recipient_address" set "chainId" = 1 where "chainId" != 1 and "chainId" != 4')
    await queryRunner.query('UPDATE "recipient_address" set "tokenId" = 1 where "tokenId" != 1')
    await queryRunner.query('DELETE FROM "supported_tokens" where "chainId" != 1 or "tokenId" != 1')
    await queryRunner.query('DELETE FROM "transaction" where "chain_id" != 1 and "chain_id" != 4')
    await queryRunner.query('DELETE FROM "token" where id != 1')
    await queryRunner.query('DELETE FROM "chain" where "id" != 1 and "id" != 4')

    for (const token of tokens) {
      await queryRunner.query(
        `INSERT INTO "token"("id", "name", "createdAt", "updatedAt", "deletedAt") VALUES (${token.id}, '${token.name}', DEFAULT, DEFAULT, DEFAULT)`
      )
    }

    for (const chain of chains) {
      for (const token of tokens) {
        queryRunner.query(`INSERT INTO "supported_tokens"("tokenId", "chainId") VALUES (${token.id}, ${chain.id})`)
      }
    }

    queryRunner.query(`INSERT INTO "supported_tokens"("tokenId", "chainId") VALUES (1, 4)`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
