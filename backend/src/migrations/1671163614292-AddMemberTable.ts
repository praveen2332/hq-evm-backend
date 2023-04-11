import { MigrationInterface, QueryRunner } from 'typeorm'
import { EProvider } from '../auth/interfaces'

export class AddMemberTable1671163614292 implements MigrationInterface {
  name = 'AddMemberTable1671163614292'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "member" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "role_id" bigint, "organization_id" bigint, "account_id" bigint, "member_profile_id" bigint, CONSTRAINT "REL_9088b70e6a59469db83ef26433" UNIQUE ("member_profile_id"), CONSTRAINT "PK_97cbbe986ce9d14ca5894fdc072" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `ALTER TABLE "member" ADD CONSTRAINT "FK_33b2aec0c43fcad85595baa1d9e" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member" ADD CONSTRAINT "FK_bfadaaab56ae7b5f2d76885d03b" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member" ADD CONSTRAINT "FK_a706d6db681a07b5f485eff318d" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member" ADD CONSTRAINT "FK_9088b70e6a59469db83ef264330" FOREIGN KEY ("member_profile_id") REFERENCES "member_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    const organization_auths = await queryRunner.query(`SELECT * FROM "organization_auth"`)
    for (const organization_auth of organization_auths) {
      if (organization_auth.provider == EProvider.WALLET) {
        const account_id = await queryRunner.query(
          `SELECT account_id FROM "auth_wallet" where id = '${organization_auth.auth_id}'`
        )
        await queryRunner.query(
          `INSERT INTO "member"("created_at", "updated_at", "deleted_at", "role_id", "organization_id", "account_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${organization_auth.role_id}', '${organization_auth.organization_id}', '${account_id[0].account_id}' )`
        )
      } else if (organization_auth.provider == EProvider.EMAIL) {
        const account_id = await queryRunner.query(
          `SELECT account_id FROM "auth_email" where id = '${organization_auth.auth_id}'`
        )
        await queryRunner.query(
          `INSERT INTO "member"("created_at", "updated_at", "deleted_at", "role_id", "organization_id", "account_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${organization_auth.role_id}', '${organization_auth.organization_id}', '${account_id[0].account_id}' )`
        )
      } else if (organization_auth.provider == EProvider.TWITTER) {
        const account_id = await queryRunner.query(
          `SELECT account_id FROM "auth_twitter" where id = '${organization_auth.auth_id}'`
        )
        await queryRunner.query(
          `INSERT INTO "member"("created_at", "updated_at", "deleted_at", "role_id", "organization_id", "account_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${organization_auth.role_id}', '${organization_auth.organization_id}', '${account_id[0].account_id}' )`
        )
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_9088b70e6a59469db83ef264330"`)
    await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_a706d6db681a07b5f485eff318d"`)
    await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_bfadaaab56ae7b5f2d76885d03b"`)
    await queryRunner.query(`ALTER TABLE "member" DROP CONSTRAINT "FK_33b2aec0c43fcad85595baa1d9e"`)
    await queryRunner.query(`ALTER TABLE "member" RENAME TO "backup_member"`)
  }
}
