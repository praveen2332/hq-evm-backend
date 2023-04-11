import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTransactionFilesColumn1665566246454 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD COLUMN "files" text array`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "files"`)
  }
}
