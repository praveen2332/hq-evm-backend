import { MigrationInterface, QueryRunner } from 'typeorm'

export class RecipientUnique1664188679684 implements MigrationInterface {
  name = 'RecipientUnique1664188679684'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92"`)
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "UQ_ae64feab2e42ece0f3e6e157595"`)
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92" UNIQUE ("contact_name", "organization_id")`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92"`)
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "UQ_ae64feab2e42ece0f3e6e157595" UNIQUE ("contact_name")`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "UQ_e0e7ae6ef5c3bc0f2b935445f92" UNIQUE ("contact_name", "organization_id")`
    )
  }
}
