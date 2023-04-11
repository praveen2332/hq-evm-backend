import { MigrationInterface, QueryRunner } from 'typeorm'

export class createMemberProfileEntitiesForExistingOrgs1670920619207 implements MigrationInterface {
  name = 'createMemberProfileEntitiesForExistingOrgs1670920619207'

  public async up(queryRunner: QueryRunner): Promise<void> {
    const auths: { organization_id: string; id: string; provider: 'wallet' | 'email'; auth: string }[] =
      await queryRunner.query(`select org_auth.organization_id,
                                      org_auth.id,
                                      org_auth.provider,
                                      CASE
                                        WHEN org_auth.provider = 'wallet' THEN aw.address
                                        ELSE ae.email
                                        END
                                        as "auth"
                               from organization_auth org_auth
                                      left join auth_email ae on CAST(org_auth.auth_id as INT) = ae.id
                                      left join auth_wallet aw on CAST(org_auth.auth_id as INT) = aw.id
                               where org_auth.member_profile_id is null

      `)
    for (const value of auths) {
      const query = `
        INSERT INTO "member_profile"("created_at", "updated_at", "deleted_at")
        VALUES (DEFAULT, DEFAULT, DEFAULT);
        UPDATE organization_auth
        set "member_profile_id" = LASTVAL()
        where id = ${value.id}
      `
      await queryRunner.query(query)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE organization_auth
                             set "member_profile_id" = null`)
    await queryRunner.query(`DELETE
                             FROM member_profile`)
  }
}
