import { MigrationInterface, QueryRunner } from 'typeorm'

export class bootstrapGainLoss1677474950730 implements MigrationInterface {
  name = 'bootstrapGainLoss1677474950730'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."additional_transformation_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed', 'terminated')`
    )
    await queryRunner.query(
      `CREATE TABLE "additional_transformation_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "address" character varying NOT NULL, "organization_id" character varying NOT NULL, "chain_id" integer NOT NULL, "status" "public"."additional_transformation_task_status_enum" NOT NULL, "last_executed_at" TIMESTAMP, "completed_at" TIMESTAMP, "metadata" json, "error" json, CONSTRAINT "PK_573a1119e305885b4f27809c708" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_metadata_type_enum" AS ENUM('deposit', 'withdrawal', 'fee', 'internal_transfer', 'group_transfer')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_metadata_status_enum" AS ENUM('synced', 'inactive', 'ignored', 'syncing')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_metadata_substatuses_enum" AS ENUM('missing_cost_basis', 'missing_price')`
    )
    await queryRunner.query(
      `CREATE TABLE "financial_transaction_child_metadata" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."financial_transaction_child_metadata_type_enum" NOT NULL, "status" "public"."financial_transaction_child_metadata_status_enum" NOT NULL, "substatuses" "public"."financial_transaction_child_metadata_substatuses_enum" array NOT NULL DEFAULT '{}', "fiat_currency" character varying, "fiat_amount" character varying, "fiat_amount_updated_by" character varying, "fiat_amount_updated_at" TIMESTAMP, "fiat_amount_per_unit" character varying, "fiat_amount_per_unit_updated_by" character varying, "fiat_amount_per_unit_updated_at" TIMESTAMP, "cost_basis" character varying, "cost_basis_updated_by" character varying, "cost_basis_updated_at" TIMESTAMP, "gain_loss" character varying, "metadata" character varying, "financial_transaction_child_id" bigint, CONSTRAINT "REL_957595c32ef4a942563b48c55f" UNIQUE ("financial_transaction_child_id"), CONSTRAINT "PK_17832911fee4074bc092a24f6e5" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_preprocess_status_enum" AS ENUM('creating', 'completed')`
    )
    await queryRunner.query(
      `CREATE TABLE "financial_transaction_preprocess" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "unique_id" character varying NOT NULL, "hash" character varying NOT NULL, "chain_id" integer NOT NULL, "from_address" character varying NOT NULL, "to_address" character varying NOT NULL, "cryptocurrency_amount" character varying NOT NULL, "value_timestamp" TIMESTAMP NOT NULL, "status" "public"."financial_transaction_preprocess_status_enum" NOT NULL, "raw_transaction_id" character varying NOT NULL, "cryptocurrency_id" bigint, CONSTRAINT "PK_8ea2395fe2c186b526a2e747eb5" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_financial_transaction_preprocess_uniqueId" ON "financial_transaction_preprocess" ("unique_id") `
    )
    await queryRunner.query(`CREATE TYPE "public"."tax_lot_status_enum" AS ENUM('available', 'sold', 'recalculating')`)
    await queryRunner.query(
      `CREATE TABLE "tax_lot" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "financial_transaction_child_id" character varying NOT NULL, "chain_id" integer NOT NULL, "amount_total" character varying NOT NULL, "amount_available" character varying NOT NULL, "status" "public"."tax_lot_status_enum" NOT NULL, "purchase_timestamp" TIMESTAMP NOT NULL, "cost_basis_amount" character varying NOT NULL, "cost_basis_per_unit" character varying NOT NULL, "cost_basis_fiat_currency" character varying NOT NULL, "wallet_group_id" character varying NOT NULL, "organization_id" character varying NOT NULL, "audit_metadata_list" jsonb, "cryptocurrency_id" bigint, CONSTRAINT "UQ_tax_lot_financial_transaction_child_id" UNIQUE ("financial_transaction_child_id"), CONSTRAINT "PK_bb36f2f31ce40ede5a57a20a38f" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "tax_lot_sale" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "financial_transaction_child_id" character varying NOT NULL, "sold_amount" character varying NOT NULL, "chain_id" integer NOT NULL, "cost_basis_amount" character varying NOT NULL, "cost_basis_per_unit" character varying NOT NULL, "cost_basis_fiat_currency" character varying NOT NULL, "cost_basis_updated_by" character varying NOT NULL, "sale_timestamp" TIMESTAMP NOT NULL, "wallet_group_id" character varying NOT NULL, "organization_id" character varying NOT NULL, "audit_metadata_list" jsonb, "tax_lot_id" bigint, "cryptocurrency_id" bigint, CONSTRAINT "PK_d885ddcedfb4c8bc7660b90687c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."preprocess_raw_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed', 'terminated')`
    )
    await queryRunner.query(
      `CREATE TABLE "preprocess_raw_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "address" character varying NOT NULL, "chain_id" integer NOT NULL, "status" "public"."preprocess_raw_task_status_enum" NOT NULL, "last_executed_at" TIMESTAMP, "completed_at" TIMESTAMP, "metadata" json, "error" json, CONSTRAINT "PK_e16336dd3c875f46ecc18380615" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "status"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_status_enum"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "type"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_type_enum"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "toAddress"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "cryptocurrencyAmount"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "fromAddress"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" ADD "from_address" character varying NOT NULL`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" ADD "to_address" character varying`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD "cryptocurrency_amount" character varying NOT NULL`
    )
    await queryRunner.query(
      `ALTER TYPE "public"."core_transformation_task_status_enum" RENAME TO "core_transformation_task_status_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."core_transformation_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed', 'terminated')`
    )
    await queryRunner.query(
      `ALTER TABLE "core_transformation_task" ALTER COLUMN "status" TYPE "public"."core_transformation_task_status_enum" USING "status"::"text"::"public"."core_transformation_task_status_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."core_transformation_task_status_enum_old"`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child_metadata" ADD CONSTRAINT "FK_957595c32ef4a942563b48c55fb" FOREIGN KEY ("financial_transaction_child_id") REFERENCES "financial_transaction_child"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_preprocess" ADD CONSTRAINT "FK_659e3874e1014f81a22d5653e44" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "tax_lot" ADD CONSTRAINT "FK_9ce6a30d191d46a8db22b083570" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "tax_lot_sale" ADD CONSTRAINT "FK_dce5ae50abd497047fc07bd51b9" FOREIGN KEY ("tax_lot_id") REFERENCES "tax_lot"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "tax_lot_sale" ADD CONSTRAINT "FK_b96a827d2c6c3d3ab96454463c1" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" DROP CONSTRAINT "FK_b96a827d2c6c3d3ab96454463c1"`)
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" DROP CONSTRAINT "FK_dce5ae50abd497047fc07bd51b9"`)
    await queryRunner.query(`ALTER TABLE "tax_lot" DROP CONSTRAINT "FK_9ce6a30d191d46a8db22b083570"`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_preprocess" DROP CONSTRAINT "FK_659e3874e1014f81a22d5653e44"`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child_metadata" DROP CONSTRAINT "FK_957595c32ef4a942563b48c55fb"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."core_transformation_task_status_enum_old" AS ENUM('created', 'running', 'completed', 'failed')`
    )
    await queryRunner.query(
      `ALTER TABLE "core_transformation_task" ALTER COLUMN "status" TYPE "public"."core_transformation_task_status_enum_old" USING "status"::"text"::"public"."core_transformation_task_status_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."core_transformation_task_status_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."core_transformation_task_status_enum_old" RENAME TO "core_transformation_task_status_enum"`
    )
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "cryptocurrency_amount"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "to_address"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "from_address"`)
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" ADD "fromAddress" character varying NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD "cryptocurrencyAmount" character varying NOT NULL`
    )
    await queryRunner.query(`ALTER TABLE "financial_transaction_child" ADD "toAddress" character varying`)
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_type_enum" AS ENUM('deposit', 'withdrawal', 'fee')`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD "type" "public"."financial_transaction_child_type_enum" NOT NULL`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."financial_transaction_child_status_enum" AS ENUM('active', 'inactive', 'ignored', 'creating')`
    )
    await queryRunner.query(
      `ALTER TABLE "financial_transaction_child" ADD "status" "public"."financial_transaction_child_status_enum" NOT NULL`
    )
    await queryRunner.query(`DROP TABLE "preprocess_raw_task"`)
    await queryRunner.query(`DROP TYPE "public"."preprocess_raw_task_status_enum"`)
    await queryRunner.query(`DROP TABLE "tax_lot_sale"`)
    await queryRunner.query(`DROP TABLE "tax_lot"`)
    await queryRunner.query(`DROP TYPE "public"."tax_lot_status_enum"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_financial_transaction_preprocess_uniqueId"`)
    await queryRunner.query(`DROP TABLE "financial_transaction_preprocess"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_preprocess_status_enum"`)
    await queryRunner.query(`DROP TABLE "financial_transaction_child_metadata"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_metadata_substatuses_enum"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_metadata_status_enum"`)
    await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_metadata_type_enum"`)
    await queryRunner.query(`DROP TABLE "additional_transformation_task"`)
    await queryRunner.query(`DROP TYPE "public"."additional_transformation_task_status_enum"`)
  }
}
