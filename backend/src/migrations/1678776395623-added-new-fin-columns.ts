import { MigrationInterface, QueryRunner } from 'typeorm'

export class addedNewFinColumns1678776395623 implements MigrationInterface {
  name = 'addedNewFinColumns1678776395623'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ADD "public_id" uuid NOT NULL DEFAULT uuid_generate_v4()`)
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_392f7184be7347bc9dbd54f7d09" UNIQUE ("public_id")`
    )
    await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "category_id" bigint`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child_metadata" ADD CONSTRAINT "FK_180885df69ac2cb7384963287fd" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child_metadata" DROP CONSTRAINT "FK_180885df69ac2cb7384963287fd"`
    )
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_8be00eed528ed60515f11c0d5e5"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "category_id"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "public_id"`)
  }
}
