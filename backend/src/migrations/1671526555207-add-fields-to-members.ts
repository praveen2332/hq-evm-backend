import { MigrationInterface, QueryRunner } from 'typeorm'

export class addFieldsToMembers1671526555207 implements MigrationInterface {
  name = 'addFieldsToMembers1671526555207'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "member" ADD "public_id" uuid NOT NULL DEFAULT uuid_generate_v4()`)
    await queryRunner.query(`ALTER TABLE "member" ADD CONSTRAINT "UQ_06849140430b8bd5c1e2dc39295" UNIQUE ("public_id")`)
    await queryRunner.query(`ALTER TABLE "member" ADD "deleted_by" bigint`)
    await queryRunner.query(
      `ALTER TABLE "member" ADD CONSTRAINT "FK_eb20d79a6877c487981778313e1" FOREIGN KEY ("deleted_by") REFERENCES "member"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_eb20d79a6877c487981778313e1"`)
    await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "deleted_by"`)
    await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "UQ_06849140430b8bd5c1e2dc39295"`)
    await queryRunner.query(`ALTER TABLE "member" DROP COLUMN "public_id"`)
  }
}
