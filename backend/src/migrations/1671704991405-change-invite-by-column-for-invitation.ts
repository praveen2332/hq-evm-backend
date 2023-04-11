import { MigrationInterface, QueryRunner } from "typeorm";

export class changeInviteByColumnForInvitation1671704991405 implements MigrationInterface {
    name = 'changeInviteByColumnForInvitation1671704991405'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "invited_by"`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD "invited_by" bigint`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "UQ_e720a7c3cde7969988b5d33ca75" UNIQUE ("invited_by")`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "FK_e720a7c3cde7969988b5d33ca75" FOREIGN KEY ("invited_by") REFERENCES "member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_e720a7c3cde7969988b5d33ca75"`);
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "UQ_e720a7c3cde7969988b5d33ca75"`);
        await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "invited_by"`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD "invited_by" character varying`);
    }

}
