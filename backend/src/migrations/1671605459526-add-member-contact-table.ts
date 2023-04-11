import { MigrationInterface, QueryRunner } from "typeorm";

export class addMemberContactTable1671605459526 implements MigrationInterface {
    name = 'addMemberContactTable1671605459526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "member_contact" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "content" character varying NOT NULL, "member_profile_id" bigint, "contact_provider_id" bigint, CONSTRAINT "PK_010842921d839a92d60f612023b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "member_contact" ADD CONSTRAINT "FK_634443cc6adca5f0a97e05de914" FOREIGN KEY ("member_profile_id") REFERENCES "member_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "member_contact" ADD CONSTRAINT "FK_951de83dbb91cab6681d1f480a1" FOREIGN KEY ("contact_provider_id") REFERENCES "contact_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member_contact" DROP CONSTRAINT "FK_951de83dbb91cab6681d1f480a1"`);
        await queryRunner.query(`ALTER TABLE "member_contact" DROP CONSTRAINT "FK_634443cc6adca5f0a97e05de914"`);
        await queryRunner.query(`DROP TABLE "member_contact"`);
    }

}
