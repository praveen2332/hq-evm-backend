import { MigrationInterface, QueryRunner } from 'typeorm'

export class DraftTransaction1662945612545 implements MigrationInterface {
  name = 'DraftTransaction1662945612545'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD "draft_transaction" json`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "draft_transaction"`)
  }
}
