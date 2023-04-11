import { MigrationInterface, QueryRunner } from 'typeorm'

export class Method1663244082051 implements MigrationInterface {
  name = 'Method1663244082051'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD "method" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "method"`)
  }
}
