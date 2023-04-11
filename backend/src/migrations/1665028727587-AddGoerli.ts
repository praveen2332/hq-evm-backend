import { MigrationInterface, QueryRunner } from 'typeorm'

const tokens = [
  {
    id: 1,
    name: 'ETH'
  },
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
  },
  {
    id: 5,
    name: 'USDT'
  },
  {
    id: 6,
    name: 'DAI'
  }
]

const chain = {
  id: 5,
  name: 'Goerli',
  isTestnet: true,
  tokens: []
}

export class AddGoerli1665028727587 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "chain"("id", "name", "isTestnet", "createdAt", "updatedAt", "deletedAt") VALUES (${chain.id}, '${
        chain.name
      }', ${chain.isTestnet ? 'TRUE' : 'FALSE'}, DEFAULT, DEFAULT, DEFAULT)`
    )

    for (const token of tokens)
      queryRunner.query(`INSERT INTO "supported_tokens"("tokenId", "chainId") VALUES (${token.id}, ${chain.id})`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "supported_tokens" where "chainId" = 5')
    await queryRunner.query('DELETE FROM "chain" where "id" = 5')
  }
}
