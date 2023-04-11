import { MigrationInterface, QueryRunner } from 'typeorm'

export class txInjectionEntities1676601515255 implements MigrationInterface {
  name = 'txInjectionEntities1676601515255'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IX_ingestion_task_source_of_fund_id_chain_id"`)
    await queryRunner.query(`ALTER TABLE "ingestion_task" DROP COLUMN "source_of_fund_id"`)
    await queryRunner.query(`ALTER TABLE "raw_transaction" ADD "internal" json`)
    await queryRunner.query(
      `ALTER TYPE "public"."ingestion_task_status_enum" RENAME TO "ingestion_task_status_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."ingestion_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed', 'terminated')`
    )
    await queryRunner.query(`ALTER TABLE "ingestion_task" ALTER COLUMN "status" DROP DEFAULT`)
    await queryRunner.query(
      `ALTER TABLE "ingestion_task" ALTER COLUMN "status" TYPE "public"."ingestion_task_status_enum" USING "status"::"text"::"public"."ingestion_task_status_enum"`
    )
    await queryRunner.query(`ALTER TABLE "ingestion_task" ALTER COLUMN "status" SET DEFAULT 'created'`)
    await queryRunner.query(`DROP TYPE "public"."ingestion_task_status_enum_old"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."ingestion_task_status_enum_old" AS ENUM('created', 'running', 'completed', 'failed')`
    )
    await queryRunner.query(`ALTER TABLE "ingestion_task" ALTER COLUMN "status" DROP DEFAULT`)
    await queryRunner.query(
      `ALTER TABLE "ingestion_task" ALTER COLUMN "status" TYPE "public"."ingestion_task_status_enum_old" USING "status"::"text"::"public"."ingestion_task_status_enum_old"`
    )
    await queryRunner.query(`ALTER TABLE "ingestion_task" ALTER COLUMN "status" SET DEFAULT 'created'`)
    await queryRunner.query(`DROP TYPE "public"."ingestion_task_status_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."ingestion_task_status_enum_old" RENAME TO "ingestion_task_status_enum"`
    )
    await queryRunner.query(`ALTER TABLE "raw_transaction" DROP COLUMN "internal"`)
    await queryRunner.query(`ALTER TABLE "ingestion_task" ADD "source_of_fund_id" character varying NOT NULL`)
    await queryRunner.query(
      `CREATE INDEX "IX_ingestion_task_source_of_fund_id_chain_id" ON "ingestion_task" ("source_of_fund_id", "chain_id") `
    )
  }
}
