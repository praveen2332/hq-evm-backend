import { MigrationInterface, QueryRunner } from 'typeorm'

export class addedTransactionFiles1679369101929 implements MigrationInterface {
  name = 'addedTransactionFiles1679369101929'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "financial_transaction_file" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "mime_type" character varying NOT NULL, "size" integer NOT NULL, "file_path" character varying NOT NULL, "key" character varying NOT NULL, "financial_transaction_child_id" character varying NOT NULL, "organization_id" character varying NOT NULL, CONSTRAINT "UQ_6d51131e9f0161111d2b49aeb66" UNIQUE ("public_id"), CONSTRAINT "PK_9fec822ea1792c4254cefc3ccc5" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "UQ_6e19bb98e00c40be14bcb6c801a"`)
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP COLUMN "public_id"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "note" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "note"`)
    await queryRunner.query(
      `ALTER TABLE "organization_setting" ADD "public_id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_setting" ADD CONSTRAINT "UQ_6e19bb98e00c40be14bcb6c801a" UNIQUE ("public_id")`
    )
    await queryRunner.query(`DROP TABLE "financial_transaction_file"`)
  }
}
