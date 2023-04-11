import { MigrationInterface, QueryRunner } from 'typeorm'

export class createMemberProfilesForMembersIfMissing1672234116079 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const members: { id: string }[] = await queryRunner.query(`select m.id
                                                               from member m
                                                               where m.member_profile_id is null`)
    for (const member of members) {
      const query = `
        INSERT INTO "member_profile"("created_at", "updated_at", "deleted_at")
        VALUES (DEFAULT, DEFAULT, DEFAULT);
        UPDATE member
        set "member_profile_id" = LASTVAL()
        where id = ${member.id}
      `
      await queryRunner.query(query)
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
