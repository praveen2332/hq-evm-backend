import { MigrationInterface, QueryRunner } from "typeorm";

export class addIgnoredTaxLotStatusEnum1679392196032 implements MigrationInterface {
    name = 'addIgnoredTaxLotStatusEnum1679392196032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."tax_lot_status_enum" RENAME TO "tax_lot_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tax_lot_status_enum" AS ENUM('available', 'sold', 'recalculating', 'ignored')`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ALTER COLUMN "status" TYPE "public"."tax_lot_status_enum" USING "status"::"text"::"public"."tax_lot_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tax_lot_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tax_lot_status_enum_old" AS ENUM('available', 'sold', 'recalculating')`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ALTER COLUMN "status" TYPE "public"."tax_lot_status_enum_old" USING "status"::"text"::"public"."tax_lot_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."tax_lot_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tax_lot_status_enum_old" RENAME TO "tax_lot_status_enum"`);
    }

}
