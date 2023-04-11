import { MigrationInterface, QueryRunner } from 'typeorm'

const polygon = {
    id: 137,
    name: 'Polygon',
    isTestnet: true,
    tokens: []
}

const MATIC = {
    name: 'MATIC'
}

const supported_tokens = [
    {
        name: 'MATIC'
    },
    { name: 'USDC' },
    { name: 'XSGD' },
    { name: 'USDT' },
    { name: 'DAI' }
]
export class supportedTokens1669023684577 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `INSERT INTO "chain"("id", "name", "isTestnet", "createdAt", "updatedAt", "deletedAt") VALUES (${polygon.id}, '${polygon.name
            }', ${polygon.isTestnet ? 'TRUE' : 'FALSE'}, DEFAULT, DEFAULT, DEFAULT)`
        )

        await queryRunner.query(
            `INSERT INTO "token"( "name", "createdAt", "updatedAt", "deletedAt") VALUES ( '${MATIC.name}', DEFAULT, DEFAULT, DEFAULT)`
        )

        for (const token of supported_tokens) {
            await queryRunner.query(
                `INSERT INTO "supported_tokens"("tokenId", "chainId") VALUES ((SELECT id FROM "token" WHERE "name" = '${token.name}'), '${polygon.id}')`
            )
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const token of supported_tokens) {
            await queryRunner.query(
                `DELETE FROM "supported_tokens" WHERE "supported_tokens"."tokenId" = (SELECT id FROM "token" WHERE "name" = '${token.name}') AND "supported_tokens"."chainId" = '${polygon.id}'`
            )
        }

        await queryRunner.query(`DELETE FROM "token" WHERE "name" = '${MATIC.name}'`)

        await queryRunner.query(`DELETE FROM "chain" WHERE "id" = '${polygon.id}' AND "name" = '${polygon.name}'`)
    }
}
