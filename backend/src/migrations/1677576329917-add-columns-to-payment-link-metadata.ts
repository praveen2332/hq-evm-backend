import { MigrationInterface, QueryRunner } from 'typeorm'

export class addColumnsToPaymentLinkMetadata1677576329917 implements MigrationInterface {
  name = 'addColumnsToPaymentLinkMetadata1677576329917'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "remarks" character varying`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ADD "contact_details" json`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ALTER COLUMN "invoice" DROP NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" ALTER COLUMN "invoice" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "contact_details"`)
    await queryRunner.query(`ALTER TABLE "payment_link_metadata" DROP COLUMN "remarks"`)
  }
}
