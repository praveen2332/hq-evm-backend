import { MigrationInterface, QueryRunner } from 'typeorm'

export class addWalletGroupIdToAdditionalTransformationTask1679146802429 implements MigrationInterface {
  name = 'addWalletGroupIdToAdditionalTransformationTask1679146802429'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "additional_transformation_task" ADD "wallet_group_id" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TABLE "fiat_currency" ADD CONSTRAINT "UQ_028322c2fd2ff03d52863faf470" UNIQUE ("alphabetic_code")`
    )
    await queryRunner.query(`ALTER TABLE "fiat_currency" DROP CONSTRAINT "UQ_fiat_currency_numeric_code"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fiat_currency" ADD CONSTRAINT "UQ_fiat_currency_numeric_code" UNIQUE ("numeric_code")`
    )
    await queryRunner.query(`ALTER TABLE "fiat_currency" DROP CONSTRAINT "UQ_028322c2fd2ff03d52863faf470"`)
    await queryRunner.query(`ALTER TABLE "additional_transformation_task" DROP COLUMN "wallet_group_id"`)
  }
}
