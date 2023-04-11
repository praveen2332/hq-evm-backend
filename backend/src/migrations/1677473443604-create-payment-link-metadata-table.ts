import { MigrationInterface, QueryRunner } from 'typeorm'

export class createPaymentLinkMetadataTable1677473443604 implements MigrationInterface {
  name = 'createPaymentLinkMetadataTable1677473443604'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_link_metadata" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "hash" character varying NOT NULL, "from_address" character varying NOT NULL, "to_address" character varying NOT NULL, "invoice" character varying NOT NULL, "payment_link_id" character varying NOT NULL, "completed_at" TIMESTAMP NOT NULL, CONSTRAINT "PK_04528fabfeec97860ce456fc7c1" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_link_metadata"`)
  }
}
