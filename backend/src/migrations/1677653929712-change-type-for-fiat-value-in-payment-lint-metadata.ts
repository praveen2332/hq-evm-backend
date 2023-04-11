import { MigrationInterface, QueryRunner } from 'typeorm'

export class changeTypeForFiatValueInPaymentLintMetadata1677653929712 implements MigrationInterface {
  name = 'changeTypeForFiatValueInPaymentLintMetadata1677653929712'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "fiat_value"`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "fiat_value" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "fiat_value"`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "fiat_value" integer`)
  }
}
