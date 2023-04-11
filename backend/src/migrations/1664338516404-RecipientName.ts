import { MigrationInterface, QueryRunner } from 'typeorm'

export class RecipientName1664338516404 implements MigrationInterface {
  name = 'RecipientName1664338516404'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92"`)
    await queryRunner.query(`ALTER TABLE "recipient" ALTER COLUMN "contact_name" DROP NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" ALTER COLUMN "contact_name" SET NOT NULL`)
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92" UNIQUE ("contact_name", "organization_id")`
    )
  }
}
