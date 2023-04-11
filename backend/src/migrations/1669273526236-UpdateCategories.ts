import { MigrationInterface, QueryRunner } from 'typeorm'

export class UpdateCategories1669273526236 implements MigrationInterface {
  name = 'UpdateCategories1669273526236'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "type" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_8be00eed528ed60515f11c0d5e5"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_8be00eed528ed60515f11c0d5e5" ON category("code", "organizationId") WHERE deleted_at IS NULL`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "type" DROP NOT NULL`)
    await queryRunner.query(`DELETE FROM "category" WHERE deleted_at IS NOT NULL`)
    await queryRunner.query(`DROP INDEX "UQ_8be00eed528ed60515f11c0d5e5"`)
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_8be00eed528ed60515f11c0d5e5" UNIQUE ("code", "organizationId")`
    )
  }
}
