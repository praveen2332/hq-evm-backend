import { MigrationInterface, QueryRunner } from 'typeorm'

const providers = ['Email', 'Twitter', 'Discord', 'Telegram']

export class Provider1662394502072 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const provider of providers) {
      queryRunner.query(
        `INSERT INTO "contact_provider"("name", "created_at", "updated_at", "deleted_at") VALUES ('${provider}', DEFAULT, DEFAULT, DEFAULT)`
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
