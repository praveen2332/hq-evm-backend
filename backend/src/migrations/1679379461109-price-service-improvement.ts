import { MigrationInterface, QueryRunner } from 'typeorm'

//https://api.coingecko.com/api/v3/simple/supported_vs_currencies

export class priceServiceImprovement1679379461109 implements MigrationInterface {
  name = 'priceServiceImprovement1679379461109'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "fiat_currency"
         SET "deleted_at" = now()
         WHERE "alphabetic_code" not in (${supportedByCoingecko.join(',')})`
    )

    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "FK_fa7bab067284c1b63d7e2326b5b"`)
    await queryRunner.query(
      `ALTER TABLE "organization_setting" ADD CONSTRAINT "UQ_fa7bab067284c1b63d7e2326b5b" UNIQUE ("organization_id")`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_setting" ADD CONSTRAINT "FK_fa7bab067284c1b63d7e2326b5b" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "FK_fa7bab067284c1b63d7e2326b5b"`)
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "UQ_fa7bab067284c1b63d7e2326b5b"`)
    await queryRunner.query(
      `ALTER TABLE "organization_setting" ADD CONSTRAINT "FK_fa7bab067284c1b63d7e2326b5b" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    await queryRunner.query(
      `UPDATE "fiat_currency"
         SET "deleted_at" = null
         WHERE "alphabetic_code" not in (${supportedByCoingecko.join(',')})`
    )
  }
}

const supportedByCoingecko = [
  "'BTC'",
  "'ETH'",
  "'LTC'",
  "'BCH'",
  "'BNB'",
  "'EOS'",
  "'XRP'",
  "'XLM'",
  "'LINK'",
  "'DOT'",
  "'YFI'",
  "'USD'",
  "'AED'",
  "'ARS'",
  "'AUD'",
  "'BDT'",
  "'BHD'",
  "'BMD'",
  "'BRL'",
  "'CAD'",
  "'CHF'",
  "'CLP'",
  "'CNY'",
  "'CZK'",
  "'DKK'",
  "'EUR'",
  "'GBP'",
  "'HKD'",
  "'HUF'",
  "'IDR'",
  "'ILS'",
  "'INR'",
  "'JPY'",
  "'KRW'",
  "'KWD'",
  "'LKR'",
  "'MMK'",
  "'MXN'",
  "'MYR'",
  "'NGN'",
  "'NOK'",
  "'NZD'",
  "'PHP'",
  "'PKR'",
  "'PLN'",
  "'RUB'",
  "'SAR'",
  "'SEK'",
  "'SGD'",
  "'THB'",
  "'TRY'",
  "'TWD'",
  "'UAH'",
  "'VEF'",
  "'VND'",
  "'ZAR'",
  "'XDR'",
  "'XAG'",
  "'XAU'",
  "'BITS'",
  "'SATS'"
]
