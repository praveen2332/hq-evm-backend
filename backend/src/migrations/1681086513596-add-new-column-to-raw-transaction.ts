import { MigrationInterface, QueryRunner } from 'typeorm'

export class addNewColumnToRawTransaction1681086513596 implements MigrationInterface {
  name = 'addNewColumnToRawTransaction1681086513596'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "raw_transaction" ADD "block_number_int" integer`)
    await queryRunner.query(`update raw_transaction
                             set block_number_int = ('x' || lpad(substring(block_number,3), 16, '0'))::bit(64)::bigint`)
    await queryRunner.query(`ALTER TABLE "raw_transaction" ALTER COLUMN "block_number_int" SET NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "raw_transaction" DROP COLUMN "block_number_int"`)
  }
}
