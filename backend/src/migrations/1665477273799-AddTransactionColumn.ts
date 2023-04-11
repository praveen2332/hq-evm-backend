import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTransactionColumn1665477273799 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD COLUMN "type" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "type"`)
  }
}
