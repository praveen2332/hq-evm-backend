import { MigrationInterface, QueryRunner } from 'typeorm'

export class Balance1663315124268 implements MigrationInterface {
  name = 'Balance1663315124268'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "source_of_fund" ADD "balance" json`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "source_of_fund" DROP COLUMN "balance"`)
  }
}
