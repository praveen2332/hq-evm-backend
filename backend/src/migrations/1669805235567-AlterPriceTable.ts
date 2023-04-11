import { MigrationInterface, QueryRunner } from 'typeorm'

export class AlterPriceTable1669805235567 implements MigrationInterface {
  name = 'AlterPriceTable1669805235567'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "price" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "tokenId" character varying NOT NULL, "date" character varying NOT NULL, "currency" character varying NOT NULL, "price" numeric, CONSTRAINT "UQ_b07734b82b04ec3ec16580341a6" UNIQUE ("tokenId", "date", "currency"), CONSTRAINT "PK_d163e55e8cce6908b2e0f27cea4" PRIMARY KEY ("id"))`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "price"`)
  }
}
