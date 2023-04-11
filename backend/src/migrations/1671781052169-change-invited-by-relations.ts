import { MigrationInterface, QueryRunner } from "typeorm";

export class changeInvitedByRelations1671781052169 implements MigrationInterface {
    name = 'changeInvitedByRelations1671781052169'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_e720a7c3cde7969988b5d33ca75"`);
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "UQ_e720a7c3cde7969988b5d33ca75"`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "FK_e720a7c3cde7969988b5d33ca75" FOREIGN KEY ("invited_by") REFERENCES "member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_e720a7c3cde7969988b5d33ca75"`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "UQ_e720a7c3cde7969988b5d33ca75" UNIQUE ("invited_by")`);
        await queryRunner.query(`ALTER TABLE "invitation" ADD CONSTRAINT "FK_e720a7c3cde7969988b5d33ca75" FOREIGN KEY ("invited_by") REFERENCES "member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
