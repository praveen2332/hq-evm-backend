import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateFinancialTransactionIndexWithDeletedAt1679236993499 implements MigrationInterface {
  name = 'updateFinancialTransactionIndexWithDeletedAt1679236993499'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_parent_publicId_organizationId"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_child_publicId_organizationId"`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" DROP CONSTRAINT "UQ_b24516c0496b6d8216bce672820"`
    )
    await queryRunner.query(`ALTER TABLE "tax_lot" DROP CONSTRAINT "UQ_ebf501bd7b85192e590fdb916d2"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_parent_publicId_organizationId" ON "financial_transaction_parent" ("public_id", "organization_id", "deleted_at") WHERE "deleted_at" IS NOT NULL`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_child_publicId_organizationId" ON "financial_transaction_child" ("public_id", "organization_id", "deleted_at") WHERE "deleted_at" IS NOT NULL`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_child_publicId_organizationId"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_parent_publicId_organizationId"`)
    await queryRunner.query(
      `ALTER TABLE "tax_lot" ADD CONSTRAINT "UQ_ebf501bd7b85192e590fdb916d2" UNIQUE ("public_id")`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD CONSTRAINT "UQ_b24516c0496b6d8216bce672820" UNIQUE ("public_id")`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_child_publicId_organizationId" ON "financial_transaction_child" ("public_id", "organization_id") `
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_parent_publicId_organizationId" ON "financial_transaction_parent" ("public_id", "organization_id") `
    )
  }
}
