import { MigrationInterface, QueryRunner } from 'typeorm'

export class addMoreColumnsToPaymentLinkMetadata1677644781406 implements MigrationInterface {
  name = 'addMoreColumnsToPaymentLinkMetadata1677644781406'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "cryptocurrency_amount" character varying`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "cryptocurrency_symbol" character varying`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "fiat_value" integer`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "fiat_value"`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "cryptocurrency_symbol"`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "cryptocurrency_amount"`)
  }
}
