import { MigrationInterface, QueryRunner } from 'typeorm'

export class changeTimezoneOffsetType1679916981858 implements MigrationInterface {
  name = 'changeTimezoneOffsetType1679916981858'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE timezone ALTER COLUMN utc_offset TYPE INTEGER USING utc_offset::INTEGER;`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE timezone ALTER COLUMN utc_offset TYPE VARCHAR USING utc_offset::VARCHAR`)
  }
}
