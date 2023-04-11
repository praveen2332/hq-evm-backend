import { MigrationInterface, QueryRunner } from 'typeorm'

export class addSynctypeToTask1680953453105 implements MigrationInterface {
  name = 'addSynctypeToTask1680953453105'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "additional_transformation_task"`)
    await queryRunner.query(
      `CREATE TYPE "public"."additional_transformation_per_wallet_group_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed', 'terminated')`
    )
    await queryRunner.query(
      `CREATE TABLE "additional_transformation_per_wallet_group_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "wallet_group_id" character varying NOT NULL, "organization_id" character varying NOT NULL, "blockchain_id" character varying NOT NULL, "status" "public"."additional_transformation_per_wallet_group_task_status_enum" NOT NULL, "sync_type" character varying, "last_executed_at" TIMESTAMP, "completed_at" TIMESTAMP, "metadata" json, "error" json, CONSTRAINT "PK_a8c4e14c78ad31d1f66b1c35226" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."additional_transformation_per_wallet_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed', 'terminated')`
    )
    await queryRunner.query(
      `CREATE TABLE "additional_transformation_per_wallet_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "wallet_id" character varying NOT NULL, "address" character varying NOT NULL, "organization_id" character varying NOT NULL, "blockchain_id" character varying NOT NULL, "status" "public"."additional_transformation_per_wallet_task_status_enum" NOT NULL, "sync_type" character varying, "last_executed_at" TIMESTAMP, "completed_at" TIMESTAMP, "metadata" json, "error" json, CONSTRAINT "PK_e0da4408fa8dfb854849e2f39aa" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`ALTER TABLE "core_transformation_task" ADD "sync_type" character varying`)
    await queryRunner.query(`ALTER TABLE "preprocess_raw_task" ADD "sync_type" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "preprocess_raw_task" DROP COLUMN "sync_type"`)
    await queryRunner.query(`ALTER TABLE "core_transformation_task" DROP COLUMN "sync_type"`)
    await queryRunner.query(`DROP TABLE "additional_transformation_per_wallet_task"`)
    await queryRunner.query(`DROP TYPE "public"."additional_transformation_per_wallet_task_status_enum"`)
    await queryRunner.query(`DROP TABLE "additional_transformation_per_wallet_group_task"`)
    await queryRunner.query(`DROP TYPE "public"."additional_transformation_per_wallet_group_task_status_enum"`)
    await queryRunner.query(
      `CREATE TABLE "additional_transformation_task" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "wallet_id" character varying NOT NULL, "address" character varying NOT NULL, "organization_id" character varying NOT NULL, "blockchain_id" character varying NOT NULL, "status" "public"."additional_transformation_task_status_enum" NOT NULL, "last_executed_at" TIMESTAMP, "completed_at" TIMESTAMP, "metadata" json, "error" json, CONSTRAINT "PK_573a1119e305885b4f27809c708" PRIMARY KEY ("id"))`
    )
  }
}
