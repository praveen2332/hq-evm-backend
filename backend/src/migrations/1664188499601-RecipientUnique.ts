import { MigrationInterface, QueryRunner } from 'typeorm'

export class RecipientUnique1664188499601 implements MigrationInterface {
  name = 'RecipientUnique1664188499601'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92" UNIQUE ("contact_name", "organization_id")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92"`)
  }
}
