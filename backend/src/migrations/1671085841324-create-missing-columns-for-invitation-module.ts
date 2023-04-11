import { MigrationInterface, QueryRunner } from 'typeorm'

export class createMissingColumnsForInvitationModule1671085841324 implements MigrationInterface {
  name = 'createMissingColumnsForInvitationModule1671085841324'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "member_profile" DROP COLUMN "email"`)
    await queryRunner.query(`ALTER TABLE "member_profile" DROP COLUMN "login_address"`)
    await queryRunner.query(`ALTER TABLE "organization_auth" ADD "invited_by" character varying`)
    await queryRunner.query(`ALTER TABLE "invitation" ADD "invited_by" character varying`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitation" DROP COLUMN "invited_by"`)
    await queryRunner.query(`ALTER TABLE "organization_auth" DROP COLUMN "invited_by"`)
    await queryRunner.query(`ALTER TABLE "member_profile" ADD "login_address" character varying`)
    await queryRunner.query(`ALTER TABLE "member_profile" ADD "email" character varying`)
  }
}
