import { MigrationInterface, QueryRunner } from 'typeorm'

export class Symbol1663238941297 implements MigrationInterface {
  name = 'Symbol1663238941297'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD "symbol" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "symbol"`)
  }
}
