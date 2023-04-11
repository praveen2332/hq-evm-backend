import { MigrationInterface, QueryRunner } from 'typeorm'

export class IndexPrice1669879113248 implements MigrationInterface {
  name = 'IndexPrice1669879113248'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_8be00eed528ed60515f11c0d5e5"`)
    await queryRunner.query(`CREATE INDEX "IDX_b07734b82b04ec3ec16580341a" ON "price" ("tokenId", "date", "currency") `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_b07734b82b04ec3ec16580341a"`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_8be00eed528ed60515f11c0d5e5" ON "category" ("code", "organizationId") WHERE (deleted_at IS NULL)`
    )
  }
}
