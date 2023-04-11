import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddCreateBy1668416266405 implements MigrationInterface {
  name = 'AddCreateBy1668416266405'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ADD "createdById" bigint`)
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_50c69cdc9b3e7494784a2fa2db4" FOREIGN KEY ("createdById") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_50c69cdc9b3e7494784a2fa2db4"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "createdById"`)
  }
}
