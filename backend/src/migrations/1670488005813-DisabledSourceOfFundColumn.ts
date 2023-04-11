import { MigrationInterface, QueryRunner } from "typeorm";

export class DisabledSourceOfFundColumn1670488005813 implements MigrationInterface {
    name = 'DisabledSourceOfFundColumn1670488005813'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "source_of_fund" ADD "disabled" boolean DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "source_of_fund" DROP COLUMN "disabled"`);
    }

}
