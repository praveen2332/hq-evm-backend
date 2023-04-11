import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTransactionColumn1665740441267 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD COLUMN "pastUSDGasFee" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "pastUSDGasFee"`)
  }
}
