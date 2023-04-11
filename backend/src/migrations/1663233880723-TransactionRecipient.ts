import { MigrationInterface, QueryRunner } from 'typeorm'

export class TransactionRecipient1663233880723 implements MigrationInterface {
  name = 'TransactionRecipient1663233880723'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" ADD "recipients" json`)
    await queryRunner.query(`ALTER TABLE "transaction" ADD "token_address" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "token_address"`)
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "recipients"`)
  }
}
