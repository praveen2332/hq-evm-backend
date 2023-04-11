import { MigrationInterface, QueryRunner } from 'typeorm'

const roles = ['Owner', 'Admin']
const permission = { resource: 'cryptocurrencies', action: 'read' }

export class addCryptocurrencyPermission1678701586515 implements MigrationInterface {
  name = 'addCryptocurrencyPermission1678701586515'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets', 'cryptocurrencies')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)

    for (const roleName of roles) {
      const role = await queryRunner.query(`SELECT id
                                              FROM "role"
                                              WHERE "name" = '${roleName}'`)
      await queryRunner.query(
        `INSERT INTO "permission"("created_at", "updated_at", "deleted_at", "resource", "action", "role_id")
                   VALUES (DEFAULT, DEFAULT, DEFAULT, '${permission.resource}', '${permission.action}', '${role[0].id}')`
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const roleName of roles) {
      const role = await queryRunner.query(`SELECT id
                                              FROM "role"
                                              WHERE "name" = '${roleName}'`)
      await queryRunner.query(
        `DELETE
                   FROM "permission"
                   where resource = '${permission.resource}' and action = '${permission.action}' and role_id='${role[0].id}'`
      )
    }

    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum_old" AS ENUM('source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum_old" USING "resource"::"text"::"public"."permission_resource_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum"`)
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum_old" RENAME TO "permission_resource_enum"`)
  }
}
