import { MigrationInterface, QueryRunner } from 'typeorm'
import { CryptocurrencyType } from '../common/services/cryptocurrencies/interfaces'

const ETHEREUM_CHAIN_ID = 1
const GOERLI_CHAIN_ID = 5

export class addBlueSGDToken1676621582537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "token" ("createdAt", "updatedAt",  "deletedAt", name, id)
       VALUES (DEFAULT, DEFAULT, DEFAULT, 'BLUSGD', 12);`
    )

    await queryRunner.query(
      `INSERT INTO "cryptocurrency"("created_at", "updated_at", "deleted_at", "name", "symbol", "decimal",
                                    "coingecko_id")
       VALUES (DEFAULT, DEFAULT, DEFAULT, 'SGD Tracker', 'BLUSGD', 18, 'sgd-tracker')`
    )

    const [{ id }] = await queryRunner.query(`SELECT id
                                            FROM "cryptocurrency"
                                            WHERE "symbol" = 'BLUSGD'`)
    await queryRunner.query(
      `INSERT INTO "cryptocurrency_address"("created_at",
                                            "updated_at",
                                            "deleted_at",
                                            "type",
                                            "address",
                                            "cryptocurrency_id",
                                            "chain_id")
       VALUES (DEFAULT,
               DEFAULT,
               DEFAULT,
               '${CryptocurrencyType.TOKEN}',
               '0x92830ef7c8d651Ed3A708053c602E807bAd7db22',
               ${id},
               '${ETHEREUM_CHAIN_ID}')`
    )
    await queryRunner.query(
      `INSERT INTO "cryptocurrency_address"("created_at",
                                            "updated_at",
                                            "deleted_at",
                                            "type",
                                            "address",
                                            "cryptocurrency_id",
                                            "chain_id")
       VALUES (DEFAULT,
               DEFAULT,
               DEFAULT,
               '${CryptocurrencyType.TOKEN}',
               '0x7cA7f84d27f11C3a1c24612b641e4Cca7C2E923B',
               ${id},
               '${GOERLI_CHAIN_ID}')`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [{ id }] = await queryRunner.query(`SELECT id
                                            FROM "cryptocurrency"
                                            WHERE "symbol" = 'BLUSGD'`)
    await queryRunner.query(
      `DELETE
       FROM "cryptocurrency_address"
       where "cryptocurrency_id" = ${id}`
    )
    await queryRunner.query(
      `DELETE
       FROM "cryptocurrency"
       where "id" = ${id}`
    )

    await queryRunner.query(
      `DELETE
       FROM "token"
       where "id" = 7`
    )
  }
}
