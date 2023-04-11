import { MigrationInterface, QueryRunner } from 'typeorm'
import { ERole } from '../roles/interfaces'

const permissions = {
  ['Owner']: [
    { resource: 'payment-links', action: 'read' },
    { resource: 'payment-links', action: 'update' },
    { resource: 'payment-links', action: 'create' },
    { resource: 'payment-links', action: 'delete' }
  ],
  ['Admin']: [
    { resource: 'payment-links', action: 'read' },
    { resource: 'payment-links', action: 'update' },
    { resource: 'payment-links', action: 'create' },
    { resource: 'payment-links', action: 'delete' }
  ]
}
export class paymentLinkEntity1675171295036 implements MigrationInterface {
  name = 'paymentLinkEntity1675171295036'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "payment_link" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "address" character varying NOT NULL, "organization_id" bigint, "chain_id" integer, "token_id" integer, CONSTRAINT "UQ_bc3b524fcc4dd624ca9fa5c3ac4" UNIQUE ("public_id"), CONSTRAINT "PK_0f9650efa36bead30593038140c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source-of-funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment-links')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)
    await queryRunner.query(
      `ALTER TABLE "payment_link" ADD CONSTRAINT "FK_48584b730907d8010bbda490f36" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment_link" ADD CONSTRAINT "FK_0192cee4f1c58d580dfe57e97cb" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment_link" ADD CONSTRAINT "FK_3df0f053f8dc870ccdc5721632b" FOREIGN KEY ("token_id") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    for (const key of Object.keys(ERole)) {
      const eRole = ERole[key]
      if (!eRole) {
        continue
      }
      const role = await queryRunner.query(`SELECT id
                                            FROM "role"
                                            WHERE "name" = '${eRole}'`)
      for (const { resource, action } of permissions[eRole] ?? []) {
        await queryRunner.query(
          `INSERT INTO "permission"("created_at", "updated_at", "deleted_at", "resource", "action", "role_id")
           VALUES (DEFAULT, DEFAULT, DEFAULT, '${resource}', '${action}', '${role[0].id}')`
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const key of Object.keys(ERole)) {
      const eRole = ERole[key]
      if (!eRole) {
        continue
      }
      const role = await queryRunner.query(`SELECT id
                                            FROM "role"
                                            WHERE "name" = '${eRole}'`)
      for (const { resource, action } of permissions[eRole] ?? []) {
        await queryRunner.query(
          `DELETE
           FROM "permission"
           where resource = '${resource}' and action = '${action}' and role_id='${role[0].id}'`
        )
      }
    }

    await queryRunner.query(`ALTER TABLE "payment_link" DROP CONSTRAINT "FK_3df0f053f8dc870ccdc5721632b"`)
    await queryRunner.query(`ALTER TABLE "payment_link" DROP CONSTRAINT "FK_0192cee4f1c58d580dfe57e97cb"`)
    await queryRunner.query(`ALTER TABLE "payment_link" DROP CONSTRAINT "FK_48584b730907d8010bbda490f36"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum_old" AS ENUM('source-of-funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum_old" USING "resource"::"text"::"public"."permission_resource_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum"`)
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum_old" RENAME TO "permission_resource_enum"`)
    await queryRunner.query(`DROP TABLE "payment_link"`)
  }
}
