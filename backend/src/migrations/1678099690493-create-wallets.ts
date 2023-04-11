import { MigrationInterface, QueryRunner } from 'typeorm'

export class createWallets1678099690493 implements MigrationInterface {
  name = 'createWallets1678099690493'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wallet_group" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "organization_id" bigint, CONSTRAINT "UQ_bd1ba125e0788b7db2aad1fcb86" UNIQUE ("public_id"), CONSTRAINT "PK_9f09cb8df47f05e208f7a12b8d0" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE TYPE "public"."wallet_source_type_enum" AS ENUM('gnosis', 'eth')`)
    await queryRunner.query(`CREATE TYPE "public"."wallet_status_enum" AS ENUM('syncing', 'synced', 'failed')`)
    await queryRunner.query(
      `CREATE TABLE "wallet" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying NOT NULL, "source_type" "public"."wallet_source_type_enum" NOT NULL DEFAULT 'eth', "metadata" json, "flagged_at" TIMESTAMP, "balance" json, "status" "public"."wallet_status_enum" NOT NULL DEFAULT 'synced', "status_per_chain" json, "organization_id" bigint, "wallet_group_id" bigint, CONSTRAINT "UQ_7930ac6cce33d4dde0c42ca5e64" UNIQUE ("public_id"), CONSTRAINT "PK_bec464dd8d54c39c54fd32e2334" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "wallet_group" ADD CONSTRAINT "FK_d74971d1bb20c070d2682bf1868" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "FK_c2381986fc93338fe1423445367" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "wallet" ADD CONSTRAINT "FK_e29d618e5b9085be8b23663de40" FOREIGN KEY ("wallet_group_id") REFERENCES "wallet_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_e29d618e5b9085be8b23663de40"`)
    await queryRunner.query(`ALTER TABLE "wallet" DROP CONSTRAINT "FK_c2381986fc93338fe1423445367"`)
    await queryRunner.query(`ALTER TABLE "wallet_group" DROP CONSTRAINT "FK_d74971d1bb20c070d2682bf1868"`)
    await queryRunner.query(`DROP TABLE "wallet"`)
    await queryRunner.query(`DROP TYPE "public"."wallet_status_enum"`)
    await queryRunner.query(`DROP TYPE "public"."wallet_source_type_enum"`)
    await queryRunner.query(`DROP TABLE "wallet_group"`)
  }
}
