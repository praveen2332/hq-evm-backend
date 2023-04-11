import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPermissionsTable1670487604579 implements MigrationInterface {
  name = 'AddPermissionsTable1670487604579'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source-of-funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members')`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."permission_action_enum" AS ENUM('create', 'read', 'update', 'delete')`
    )
    await queryRunner.query(
      `CREATE TABLE "permission" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "resource" "public"."permission_resource_enum" NOT NULL, "action" "public"."permission_action_enum" NOT NULL, "role_id" bigint, CONSTRAINT "PK_3b8b97af9d9d8807e41e6f48362" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "permissions"`)
    await queryRunner.query(
      `ALTER TABLE "permission" ADD CONSTRAINT "FK_383892d758d08d346f837d3d8b7" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "permission" DROP CONSTRAINT "FK_383892d758d08d346f837d3d8b7"`)
    await queryRunner.query(`ALTER TABLE "role" ADD "permissions" json`)
    await queryRunner.query(`DROP TABLE "permission"`)
    await queryRunner.query(`DROP TYPE "public"."permission_action_enum"`)
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum"`)
  }
}
