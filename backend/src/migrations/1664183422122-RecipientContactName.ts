import { MigrationInterface, QueryRunner } from 'typeorm'

export class RecipientContactName1664183422122 implements MigrationInterface {
  name = 'RecipientContactName1664183422122'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "UQ_ae64feab2e42ece0f3e6e157595" UNIQUE ("contact_name")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "UQ_ae64feab2e42ece0f3e6e157595"`)
  }
}
