import { MigrationInterface, QueryRunner } from 'typeorm'
import { ERole } from '../roles/interfaces'

const permissions = {
  ['Owner']: [
    { resource: 'invitations', action: 'read' },
    { resource: 'invitations', action: 'update' },
    { resource: 'invitations', action: 'delete' }
  ],
  ['Admin']: [
    { resource: 'invitations', action: 'read' },
    { resource: 'invitations', action: 'update' },
    { resource: 'invitations', action: 'delete' }
  ]
}

export class AddedMorePermissions1670838604259 implements MigrationInterface {
  name = 'addedMorePermissions1670838604259'

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }
}
