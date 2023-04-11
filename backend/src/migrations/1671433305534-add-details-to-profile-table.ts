import { MigrationInterface, QueryRunner } from 'typeorm'

export class addDetailsToProfileTable1671433305534 implements MigrationInterface {
  name = 'addDetailsToProfileTable1671433305534'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "full_name"`)
    await queryRunner.query(`ALTER TABLE "member_profile" ADD "first_name" character varying`)
    await queryRunner.query(`ALTER TABLE "member_profile" ADD "last_name" character varying`)
    await queryRunner.query(`ALTER TABLE "invitation" ADD "first_name" character varying NOT NULL`)
    await queryRunner.query(`ALTER TABLE "invitation" ADD "last_name" character varying NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "last_name"`)
    await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "first_name"`)
    await queryRunner.query(`ALTER TABLE "member_profile" DROP COLUMN "last_name"`)
    await queryRunner.query(`ALTER TABLE "member_profile" DROP COLUMN "first_name"`)
    await queryRunner.query(`ALTER TABLE "invitation" ADD "full_name" character varying NOT NULL`)
  }
}
