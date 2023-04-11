import { MigrationInterface, QueryRunner } from 'typeorm'

const coingeckoIdsToBeVerifiedAndDecimal = {
  ethereum: { decimal: 18 },
  'usd-coin': { decimal: 6 },
  'matic-network': { decimal: 18 },
  xsgd: { decimal: 6 },
  'straitsx-indonesia-rupiah': { decimal: 6 },
  tether: { decimal: 6 },
  dai: { decimal: 18 },
  'sgd-tracker': { decimal: 18 }
}

export class updateCryptocurrencyTableWithVerifiedAndImage1677646979033 implements MigrationInterface {
  name = 'updateCryptocurrencyTableWithVerifiedAndImage1677646979033'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" DROP CONSTRAINT "FK_329c627f2043ebc491e40767d92"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" DROP COLUMN "decimal"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" ADD "decimal" integer`)

    await queryRunner.query(`ALTER TABLE "cryptocurrency" ADD "is_verified" boolean NOT NULL DEFAULT false`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" ADD "image" json`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" ALTER COLUMN "chain_id" SET NOT NULL`)

    for (const coingeckoId in coingeckoIdsToBeVerifiedAndDecimal) {
      await queryRunner.query(
        `UPDATE "cryptocurrency" SET
                      "is_verified" = 'true'
                      WHERE "coingecko_id" = '${coingeckoId}'`
      )

      const addresses = await queryRunner.query(
        `SELECT "ca"."id" as "id", "ca"."address" as "address" FROM "cryptocurrency_address" "ca" INNER JOIN "cryptocurrency" "c" ON "c"."id" = "ca"."cryptocurrency_id" WHERE "c"."coingecko_id" = '${coingeckoId}'`
      )

      for (const address of addresses) {
        await queryRunner.query(
          `UPDATE "cryptocurrency_address" SET
                              "decimal" = '${coingeckoIdsToBeVerifiedAndDecimal[coingeckoId].decimal}'
                              WHERE "id" = '${address.id}'`
        )

        if (coingeckoId === 'sgd-tracker') {
          await queryRunner.query(
            `UPDATE "cryptocurrency_address" SET
                                "address" = '${address.address.toLowerCase()}'
                                WHERE "id" = '${address.id}'`
          )
        }
      }
    }

    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" ALTER COLUMN "decimal" SET NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" ALTER COLUMN "chain_id" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" DROP COLUMN "image"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" DROP COLUMN "is_verified"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" DROP COLUMN "decimal"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" ADD "decimal" integer`)

    for (const coingeckoId in coingeckoIdsToBeVerifiedAndDecimal) {
      await queryRunner.query(
        `UPDATE "cryptocurrency" SET
                        "decimal" = '${coingeckoIdsToBeVerifiedAndDecimal[coingeckoId].decimal}'
                        WHERE "coingecko_id" = '${coingeckoId}'`
      )
    }

    await queryRunner.query(
      `ALTER TABLE "cryptocurrency_address" ADD CONSTRAINT "FK_329c627f2043ebc491e40767d92" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }
}
