import { MigrationInterface, QueryRunner } from "typeorm";

export class addFullNameToAccount1673259926731 implements MigrationInterface {
    name = 'addFullNameToAccount1673259926731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "member_profile" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "member_profile" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "account" ADD "first_name" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "last_name" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "member_profile" ADD "last_name" character varying`);
        await queryRunner.query(`ALTER TABLE "member_profile" ADD "first_name" character varying`);
    }

}
