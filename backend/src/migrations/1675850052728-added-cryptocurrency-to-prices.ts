import { MigrationInterface, QueryRunner } from 'typeorm'

export class addedCryptocurrencyToPrices1675850052728 implements MigrationInterface {
  name = 'addedCryptocurrencyToPrices1675850052728'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_b07734b82b04ec3ec16580341a"`)
    await queryRunner.query(`ALTER TABLE "price" DROP CONSTRAINT "UQ_b07734b82b04ec3ec16580341a6"`)
    await queryRunner.query(`ALTER TABLE "price" ADD "cryptocurrency_id" bigint`)
    await queryRunner.query(`ALTER TABLE "price" ALTER COLUMN "tokenId" DROP NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "price" ADD CONSTRAINT "UQ_price_cryptocurrency_id_date_currency" UNIQUE ("cryptocurrency_id", "date", "currency")`
    )
    await queryRunner.query(
      `ALTER TABLE "price" ADD CONSTRAINT "FK_e2a38ed14487146389e7247264a" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    const cryptocurrency: { id: string; coingecko_id: string }[] = await queryRunner.query(
      `SELECT id, coingecko_id FROM "cryptocurrency"`
    )
    const tokens: { tokenId: string }[] = await queryRunner.query(`select "tokenId" from price group by "tokenId"`)

    for (const token of tokens) {
      const cryptocurrencyId = cryptocurrency.find((c) => c.coingecko_id === token.tokenId)?.id
      if (cryptocurrencyId) {
        await queryRunner.query(
          `UPDATE "price" SET "cryptocurrency_id" = ${cryptocurrencyId} WHERE "tokenId" = '${token.tokenId}'`
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "price" DROP CONSTRAINT "FK_e2a38ed14487146389e7247264a"`)
    await queryRunner.query(`ALTER TABLE "price" DROP CONSTRAINT "UQ_price_cryptocurrency_id_date_currency"`)
    await queryRunner.query(`ALTER TABLE "price" ALTER COLUMN "tokenId" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "price" DROP COLUMN "cryptocurrency_id"`)
    await queryRunner.query(
      `ALTER TABLE "price" ADD CONSTRAINT "UQ_b07734b82b04ec3ec16580341a6" UNIQUE ("tokenId", "date", "currency")`
    )
    await queryRunner.query(`CREATE INDEX "IDX_b07734b82b04ec3ec16580341a" ON "price" ("tokenId", "date", "currency") `)
  }
}
