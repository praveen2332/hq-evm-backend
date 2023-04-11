import { MigrationInterface, QueryRunner } from 'typeorm'
import { ERole } from '../roles/interfaces'

const permissions = {
  ['Owner']: [
    { resource: 'financial_transactions', action: 'create' },
    { resource: 'financial_transactions', action: 'read' },
    { resource: 'financial_transactions', action: 'update' },
    { resource: 'financial_transactions', action: 'delete' },
    { resource: 'wallets', action: 'create' },
    { resource: 'wallets', action: 'read' },
    { resource: 'wallets', action: 'update' },
    { resource: 'wallets', action: 'delete' },
    { resource: 'wallet_groups', action: 'create' },
    { resource: 'wallet_groups', action: 'read' },
    { resource: 'wallet_groups', action: 'update' },
    { resource: 'wallet_groups', action: 'delete' },
    { resource: 'assets', action: 'create' },
    { resource: 'assets', action: 'read' },
    { resource: 'assets', action: 'update' },
    { resource: 'assets', action: 'delete' }
  ],
  ['Admin']: [
    { resource: 'financial_transactions', action: 'create' },
    { resource: 'financial_transactions', action: 'read' },
    { resource: 'financial_transactions', action: 'update' },
    { resource: 'financial_transactions', action: 'delete' },
    { resource: 'wallets', action: 'create' },
    { resource: 'wallets', action: 'read' },
    { resource: 'wallet_groups', action: 'create' },
    { resource: 'wallet_groups', action: 'read' },
    { resource: 'wallet_groups', action: 'update' },
    { resource: 'wallet_groups', action: 'delete' },
    { resource: 'assets', action: 'create' },
    { resource: 'assets', action: 'read' },
    { resource: 'assets', action: 'update' },
    { resource: 'assets', action: 'delete' }
  ]
}

export class fixPermissionsForFinancialTransactionsGrid1678341551027 implements MigrationInterface {
  name = 'fixPermissionsForFinancialTransactionsGrid1678341551027'

  public async up(queryRunner: QueryRunner): Promise<void> {
    //Create temporary enum
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)

    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source-of-funds', 'payment-links', 'source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets')`
    )

    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )

    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)

    //Update values from previous enum to new enum
    await queryRunner.query(`UPDATE "permission" SET "resource"='source_of_funds' WHERE "resource"='source-of-funds'`)
    await queryRunner.query(`UPDATE "permission" SET "resource"='payment_links' WHERE "resource"='payment-links'`)

    //Update to new enum
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)

    for (const key of Object.keys(permissions)) {
      const eRole = ERole[key]
      const role = await queryRunner.query(`SELECT id
                                            FROM "role"
                                            WHERE "name" = '${eRole}'`)
      for (const { resource, action } of permissions[eRole]) {
        await queryRunner.query(
          `INSERT INTO "permission"("created_at", "updated_at", "deleted_at", "resource", "action", "role_id")
                 VALUES (DEFAULT, DEFAULT, DEFAULT, '${resource}', '${action}', '${role[0].id}')`
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const key of Object.keys(permissions)) {
      const eRole = ERole[key]
      const role = await queryRunner.query(`SELECT id
                                            FROM "role"
                                            WHERE "name" = '${eRole}'`)
      for (const { resource, action } of permissions[eRole]) {
        await queryRunner.query(
          `DELETE
                 FROM "permission"
                 where resource = '${resource}' and action = '${action}' and role_id='${role[0].id}'`
        )
      }
    }

    //Create temporary enum
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)

    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source-of-funds', 'payment-links', 'source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets')`
    )

    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )

    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)

    //Update values from previous enum to new enum
    await queryRunner.query(`UPDATE "permission" SET "resource"='source-of-funds' WHERE "resource"='source_of_funds'`)
    await queryRunner.query(`UPDATE "permission" SET "resource"='payment-links' WHERE "resource"='payment_links'`)

    //Update to new enum
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source-of-funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment-links', 'financial_transactions')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)
  }
}
