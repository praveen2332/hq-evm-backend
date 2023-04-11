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
  {
    id: 5,
    name: 'USDT'
  },
  {
    id: 6,
    name: 'DAI'
  }
]

export class AddMoreTokens1664172329567 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
