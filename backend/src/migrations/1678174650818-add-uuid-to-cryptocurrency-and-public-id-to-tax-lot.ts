import { MigrationInterface, QueryRunner } from 'typeorm'

export class addUuidToCryptocurrencyAndPublicIdToTaxLot1678174650818 implements MigrationInterface {
  name = 'addUuidToCryptocurrencyAndPublicIdToTaxLot1678174650818'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cryptocurrency" ADD "public_id" uuid NOT NULL DEFAULT uuid_generate_v4()`)
    await queryRunner.query(
      `ALTER TABLE "cryptocurrency" ADD CONSTRAINT "UQ_1a3f25d701132251524e2a6d02d" UNIQUE ("public_id")`
    )
    await queryRunner.query(`ALTER TABLE "tax_lot" ADD "public_id" character varying NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "tax_lot" ADD CONSTRAINT "UQ_ebf501bd7b85192e590fdb916d2" UNIQUE ("public_id")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tax_lot" DROP CONSTRAINT "UQ_ebf501bd7b85192e590fdb916d2"`)
    await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "public_id"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" DROP CONSTRAINT "UQ_1a3f25d701132251524e2a6d02d"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency" DROP COLUMN "public_id"`)
  }
}
