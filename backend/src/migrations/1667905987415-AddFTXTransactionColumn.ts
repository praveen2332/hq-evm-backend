import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFTXTransactionColumn1667905987415 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD COLUMN "ftx_transaction" json`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "ftx_transaction"`)
  }
}
