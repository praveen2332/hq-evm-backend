import { MigrationInterface, QueryRunner } from 'typeorm'

export class bootstrapCoreTransformations1676352336972 implements MigrationInterface {
  name = 'bootstrapCoreTransformations1676352336972'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."core_transformation_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed')`
    )
    await queryRunner.query(
      `CREATE TABLE "core_transformation_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "address" character varying NOT NULL, "organization_id" character varying NOT NULL, "chain_id" integer NOT NULL, "status" "public"."core_transformation_task_status_enum" NOT NULL, "last_executed_at" TIMESTAMP, "completed_at" TIMESTAMP, "metadata" json, "error" json, CONSTRAINT "PK_4bd42c6868f13745ccfa2d205bb" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_type_enum" AS ENUM('deposit', 'withdrawal', 'fee')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_status_enum" AS ENUM('active', 'inactive', 'ignored', 'creating')`
    )
    await queryRunner.query(
      `CREATE TABLE "financial_transaction_child" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" character varying NOT NULL, "hash" character varying NOT NULL, "chain_id" integer NOT NULL, "type" "public"."financial_transaction_child_type_enum" NOT NULL, "fromAddress" character varying NOT NULL, "toAddress" character varying, "cryptocurrencyAmount" character varying NOT NULL, "value_timestamp" TIMESTAMP NOT NULL, "status" "public"."financial_transaction_child_status_enum" NOT NULL, "organization_id" character varying NOT NULL, "cryptocurrency_id" bigint, "financial_transaction_parent_id" bigint, CONSTRAINT "UQ_b24516c0496b6d8216bce672820" UNIQUE ("public_id"), CONSTRAINT "PK_2dc4c7900daf06d1c834a73e620" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_child_publicId_organizationId" ON "financial_transaction_child" ("public_id", "organization_id") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_parent_activity_enum" AS ENUM('transfer', 'swap', 'off_ramp', 'on_ramp', 'mint', 'burn', 'contract_interaction')`
    )
    await queryRunner.query(
      `CREATE TABLE "financial_transaction_parent" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" character varying NOT NULL, "hash" character varying NOT NULL, "chain_id" integer NOT NULL, "activity" "public"."financial_transaction_parent_activity_enum" NOT NULL, "organization_id" character varying NOT NULL, "status" character varying NOT NULL, "value_timestamp" TIMESTAMP NOT NULL, CONSTRAINT "PK_1afc2f61741e098eca5c1ba4215" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_parent_publicId_organizationId" ON "financial_transaction_parent" ("public_id", "organization_id") `
    )
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source-of-funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment-links', 'financial_transactions')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD CONSTRAINT "FK_0bac782d3e3460cef642c3f9788" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD CONSTRAINT "FK_20debb23e0ad5fa097025806100" FOREIGN KEY ("financial_transaction_parent_id") REFERENCES "financial_transaction_parent"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" DROP CONSTRAINT "FK_20debb23e0ad5fa097025806100"`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" DROP CONSTRAINT "FK_0bac782d3e3460cef642c3f9788"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum_old" AS ENUM('source-of-funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment-links')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum_old" USING "resource"::"text"::"public"."permission_resource_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum"`)
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum_old" RENAME TO "permission_resource_enum"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_parent_publicId_organizationId"`)
    await queryRunner.query(`DROP TABLE "financial_transaction_parent"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_parent_activity_enum"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_child_publicId_organizationId"`)
    await queryRunner.query(`DROP TABLE "financial_transaction_child"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_status_enum"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_type_enum"`)
    await queryRunner.query(`DROP TABLE "core_transformation_task"`)
    await queryRunner.query(`DROP TYPE "public"."core_transformation_task_status_enum"`)
  }
}
