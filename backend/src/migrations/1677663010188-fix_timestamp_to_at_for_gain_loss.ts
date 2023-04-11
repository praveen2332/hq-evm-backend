import { MigrationInterface, QueryRunner } from 'typeorm'

export class fixTimestampToAtForGainLoss1677663010188 implements MigrationInterface {
  name = 'fixTimestampToAtForGainLoss1677663010188'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tax_lot" RENAME COLUMN "purchase_timestamp" TO "purchased_at"`)
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" RENAME COLUMN "sale_timestamp" TO "sold_at"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" RENAME COLUMN "sold_at" TO "sale_timestamp"`)
    await queryRunner.query(`ALTER TABLE "tax_lot" RENAME COLUMN "purchased_at" TO "purchase_timestamp"`)
  }
}
