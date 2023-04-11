import { MigrationInterface, QueryRunner } from 'typeorm'

export class CategoryType1663655545963 implements MigrationInterface {
  name = 'CategoryType1663655545963'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."category_type_enum" AS ENUM('outgoing', 'incoming')`)
    await queryRunner.query(`ALTER TABLE "category" ADD "type" "public"."category_type_enum"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "type"`)
    await queryRunner.query(`DROP TYPE "public"."category_type_enum"`)
  }
}
