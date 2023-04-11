import { MigrationInterface, QueryRunner } from 'typeorm'
import { ERole } from '../roles/interfaces'

const permissions = {
  ['Owner']: [
    { resource: 'source-of-funds', action: 'create' },
    { resource: 'source-of-funds', action: 'read' },
    { resource: 'source-of-funds', action: 'update' },
    { resource: 'source-of-funds', action: 'delete' },
    { resource: 'transfers', action: 'create' },
    { resource: 'transfers', action: 'read' },
    { resource: 'transactions', action: 'read' },
    { resource: 'transactions', action: 'update' },
    { resource: 'invitations', action: 'create' },
    { resource: 'recipients', action: 'create' },
    { resource: 'recipients', action: 'read' },
    { resource: 'recipients', action: 'update' },
    { resource: 'recipients', action: 'delete' },
    { resource: 'categories', action: 'create' },
    { resource: 'categories', action: 'read' },
    { resource: 'categories', action: 'update' },
    { resource: 'categories', action: 'delete' }
  ],
  ['Admin']: [
    { resource: 'source-of-funds', action: 'create' },
    { resource: 'source-of-funds', action: 'read' },
    { resource: 'transfers', action: 'create' },
    { resource: 'transfers', action: 'read' },
    { resource: 'transactions', action: 'read' },
    { resource: 'transactions', action: 'update' },
    { resource: 'invitations', action: 'create' },
    { resource: 'recipients', action: 'create' },
    { resource: 'recipients', action: 'read' },
    { resource: 'recipients', action: 'update' },
    { resource: 'recipients', action: 'delete' },
    { resource: 'categories', action: 'create' },
    { resource: 'categories', action: 'read' },
    { resource: 'categories', action: 'update' },
    { resource: 'categories', action: 'delete' }
  ],
  ['Employee']: [
    { resource: 'members', action: 'read' },
    { resource: 'members', action: 'update' }
  ]
}

const removedRoles = [ERole.Vendor, ERole.Auditor, ERole.BillingManager]

export class SeedPermissionTable1670551294328 implements MigrationInterface {
  name = 'SeedPermissionTable1670551294328'

  public async up(queryRunner: QueryRunner): Promise<void> {
    removedRoles.map(async (role) => await queryRunner.query(`DELETE FROM "role" WHERE "name" = '${role}'`))

    for (const key of Object.keys(ERole)) {
      const role = await queryRunner.query(`SELECT id FROM "role" WHERE "name" = '${ERole[key]}'`)
      if (removedRoles.includes(ERole[key])) continue
      for (const { resource, action } of permissions[ERole[key]]) {
        await queryRunner.query(
          `INSERT INTO "permission"("created_at", "updated_at", "deleted_at", "resource", "action", "role_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${resource}', '${action}', '${role[0].id}' )`
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    removedRoles.map(
      async (role) =>
        await queryRunner.query(
          `INSERT INTO "role"("created_at", "updated_at", "deleted_at", "name") VALUES (DEFAULT, DEFAULT, DEFAULT, '${role}' )`
        )
    )

    await queryRunner.query(`DELETE FROM "permission"`)
  }
}
