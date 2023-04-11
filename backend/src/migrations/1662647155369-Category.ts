import { MigrationInterface, QueryRunner } from 'typeorm'

export class Category1662647155369 implements MigrationInterface {
  name = 'Category1662647155369'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "category" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "organization_id" bigint, CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name"), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "transaction_category" ("categoryId" bigint NOT NULL, "transactionId" bigint NOT NULL, CONSTRAINT "PK_0b1864c71de617960f076bc9c2c" PRIMARY KEY ("categoryId", "transactionId"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_9679838db405fac853420e48e0" ON "transaction_category" ("categoryId") `)
    await queryRunner.query(
      `CREATE INDEX "IDX_65e930323eb538188619d0c430" ON "transaction_category" ("transactionId") `
    )
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_d5594fcb9d4210bcad13098173a" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction_category" ADD CONSTRAINT "FK_9679838db405fac853420e48e0c" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction_category" ADD CONSTRAINT "FK_65e930323eb538188619d0c430d" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction_category" DROP CONSTRAINT "FK_65e930323eb538188619d0c430d"`)
    await queryRunner.query(`ALTER TABLE "transaction_category" DROP CONSTRAINT "FK_9679838db405fac853420e48e0c"`)
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_d5594fcb9d4210bcad13098173a"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_65e930323eb538188619d0c430"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_9679838db405fac853420e48e0"`)
    await queryRunner.query(`DROP TABLE "transaction_category"`)
    await queryRunner.query(`DROP TABLE "category"`)
  }
}
