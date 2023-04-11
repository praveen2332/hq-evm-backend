import { MigrationInterface, QueryRunner } from 'typeorm'

export class addGnosisMetadataToChild1679970064000 implements MigrationInterface {
  name = 'addGnosisMetadataToChild1679970064000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "gnosis_metadata" json`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "gnosis_metadata"`)
  }
}
