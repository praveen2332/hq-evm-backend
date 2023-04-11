import { MigrationInterface, QueryRunner } from 'typeorm'

export class txInjectionEntities1675679397930 implements MigrationInterface {
  name = 'txInjectionEntities1675679397930'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."raw_transaction_status_enum" AS ENUM('RUNNING', 'COMPLETED')`)
    await queryRunner.query(
      `CREATE TABLE "raw_transaction" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "chain_id" integer NOT NULL, "hash" character varying NOT NULL, "address" character varying NOT NULL, "block_number" character varying NOT NULL, "block_timestamp" character varying NOT NULL, "ingestion_task_id" character varying NOT NULL, "receipt" json, "to" json, "from" json, "status" "public"."raw_transaction_status_enum" NOT NULL DEFAULT 'RUNNING', CONSTRAINT "PK_7ebc020808dbfe5249d84829bc4" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_raw_transaction_hash_chainId_address" ON "raw_transaction" ("hash", "chain_id", "address") `
    )
    await queryRunner.query(
      `CREATE TYPE "public"."ingestion_task_status_enum" AS ENUM('CREATED', 'RUNNING', 'COMPLETED', 'FAILED')`
    )
    await queryRunner.query(
      `CREATE TABLE "ingestion_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "source_of_fund_id" character varying NOT NULL, "address" character varying NOT NULL, "status" "public"."ingestion_task_status_enum" NOT NULL DEFAULT 'CREATED', "amount_processed" integer NOT NULL, "last_execution_at" TIMESTAMP, "completed_at" TIMESTAMP, "chain_id" integer NOT NULL, "metadata" json, "error" json, CONSTRAINT "PK_17e8fdd6564d9492e8c9aca7c15" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IX_ingestion_task_source_of_fund_id_chain_id" ON "ingestion_task" ("source_of_fund_id", "chain_id") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IX_ingestion_task_source_of_fund_id_chain_id"`)
    await queryRunner.query(`DROP TABLE "ingestion_task"`)
    await queryRunner.query(`DROP TYPE "public"."ingestion_task_status_enum"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_raw_transaction_hash_chainId_address"`)
    await queryRunner.query(`DROP TABLE "raw_transaction"`)
    await queryRunner.query(`DROP TYPE "public"."raw_transaction_status_enum"`)
  }
}
