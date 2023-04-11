import { MigrationInterface, QueryRunner } from 'typeorm'

export class AnalysisTable1670325551093 implements MigrationInterface {
  name = 'AnalysisTable1670325551093'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "analysis" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "url" character varying NOT NULL, "event" character varying NOT NULL, "referrer" character varying, "timestamp" TIMESTAMP NOT NULL, "source_ip" character varying NOT NULL, "user_agent" character varying NOT NULL, "payload" json NOT NULL, CONSTRAINT "PK_300795d51c57ef52911ed65851f" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "analysis"`)
  }
}
