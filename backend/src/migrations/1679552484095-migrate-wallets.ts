import { MigrationInterface, QueryRunner } from 'typeorm'

export class migrateWallets1679552484095 implements MigrationInterface {
  name = 'migrateWallets1679552484095'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `insert into feature_flag (name, is_enabled) values ('financial_transaction_migration', false)`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`delete from feature_flag where name = 'financial_transaction_migration'`)
  }
}
