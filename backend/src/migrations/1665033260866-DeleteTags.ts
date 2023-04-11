import { MigrationInterface, QueryRunner } from "typeorm";

export class DeleteTags1665033260866 implements MigrationInterface {
    name = 'DeleteTags1665033260866'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "tags"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transaction" ADD "tags" text array`);
    }

}
