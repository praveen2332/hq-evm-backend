import { MigrationInterface, QueryRunner } from 'typeorm'

export class fixTaskStatusEnum1676438349558 implements MigrationInterface {
  name = 'fixTaskStatusEnum1676438349558'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."ingestion_task_status_enum" RENAME TO "ingestion_task_status_enum_old"`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."ingestion_task_status_enum" AS ENUM('created', 'running', 'completed', 'failed')`
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
      `CREATE TYPE "public"."ingestion_task_status_enum_old" AS ENUM('CREATED', 'RUNNING', 'COMPLETED', 'FAILED')`
    )
    await queryRunner.query(`ALTER TABLE "ingestion_task" ALTER COLUMN "status" DROP DEFAULT`)
    await queryRunner.query(
      `ALTER TABLE "ingestion_task" ALTER COLUMN "status" TYPE "public"."ingestion_task_status_enum_old" USING "status"::"text"::"public"."ingestion_task_status_enum_old"`
    )
    await queryRunner.query(`ALTER TABLE "ingestion_task" ALTER COLUMN "status" SET DEFAULT 'CREATED'`)
    await queryRunner.query(`DROP TYPE "public"."ingestion_task_status_enum"`)
    await queryRunner.query(
      `ALTER TYPE "public"."ingestion_task_status_enum_old" RENAME TO "ingestion_task_status_enum"`
    )
  }
}
