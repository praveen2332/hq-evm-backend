import { MigrationInterface, QueryRunner } from 'typeorm'

export class upgradeInvitationTables1670912238732 implements MigrationInterface {
  name = 'upgradeInvitationTables1670912238732'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "member_address" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "address" character varying NOT NULL, "member_profile_id" bigint, "chainId" integer, "tokenId" integer, CONSTRAINT "PK_a4a977f9b72b362e6432ad2e9f6" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "member_profile" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying, "login_address" character varying, CONSTRAINT "PK_157ca6e25e9cbd657a2302fb12d" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`ALTER TABLE "organization_auth" ADD "member_profile_id" bigint`)
    await queryRunner.query(
      `ALTER TABLE "organization_auth" ADD CONSTRAINT "UQ_7c75d8640071d1db4006d9cd47b" UNIQUE ("member_profile_id")`
    )
    await queryRunner.query(`ALTER TABLE "invitation" ADD "message" character varying`)
    await queryRunner.query(
      `ALTER TABLE "member_address" ADD CONSTRAINT "FK_950d02a3893477a654fa91a37ea" FOREIGN KEY ("member_profile_id") REFERENCES "member_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member_address" ADD CONSTRAINT "FK_1cec54b90aa31fc7c68e8b28ce3" FOREIGN KEY ("chainId") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member_address" ADD CONSTRAINT "FK_275dd724e0cb097b38667f854fd" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_auth" ADD CONSTRAINT "FK_7c75d8640071d1db4006d9cd47b" FOREIGN KEY ("member_profile_id") REFERENCES "member_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organization_auth" DROP CONSTRAINT "FK_7c75d8640071d1db4006d9cd47b"`)
    await queryRunner.query(`ALTER TABLE "member_address" DROP CONSTRAINT "FK_275dd724e0cb097b38667f854fd"`)
    await queryRunner.query(`ALTER TABLE "member_address" DROP CONSTRAINT "FK_1cec54b90aa31fc7c68e8b28ce3"`)
    await queryRunner.query(`ALTER TABLE "member_address" DROP CONSTRAINT "FK_950d02a3893477a654fa91a37ea"`)
    await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "message"`)
    await queryRunner.query(`ALTER TABLE "organization_auth" DROP CONSTRAINT "UQ_7c75d8640071d1db4006d9cd47b"`)
    await queryRunner.query(`ALTER TABLE "organization_auth" DROP COLUMN "member_profile_id"`)
    await queryRunner.query(`DROP TABLE "member_profile"`)
    await queryRunner.query(`DROP TABLE "member_address"`)
  }
}
