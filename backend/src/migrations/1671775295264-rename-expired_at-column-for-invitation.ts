import { MigrationInterface, QueryRunner } from 'typeorm'

export class renameExpiredAtColumnForInvitation1671775295264 implements MigrationInterface {
  name = 'renameExpiredAtColumnForInvitation1671775295264'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitation" RENAME COLUMN "expiredAt" TO "expired_at"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invitation" RENAME COLUMN "expired_at" TO "expiredAt"`)
  }
}
