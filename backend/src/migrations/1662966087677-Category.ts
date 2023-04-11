import { MigrationInterface, QueryRunner } from 'typeorm'

export class Category1662966087677 implements MigrationInterface {
  name = 'Category1662966087677'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_d5594fcb9d4210bcad13098173a"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "organization_id"`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ADD "organization_id" bigint`)
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_d5594fcb9d4210bcad13098173a" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }
}
