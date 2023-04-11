import { MigrationInterface, QueryRunner } from "typeorm";

export class addGainLossInclusionStatusToChildMetadata1679888324424 implements MigrationInterface {
    name = 'addGainLossInclusionStatusToChildMetadata1679888324424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."financial_transaction_child_metadata_gain_loss_inclusion_status_enum" AS ENUM('all', 'none', 'purchase_only', 'sell_only')`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "gain_loss_inclusion_status" "public"."financial_transaction_child_metadata_gain_loss_inclusion_status_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "status_reason" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."tax_lot_status_enum" RENAME TO "tax_lot_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."tax_lot_status_enum" AS ENUM('available', 'sold', 'recalculating', 'inactive')`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ALTER COLUMN "status" TYPE "public"."tax_lot_status_enum" USING "status"::"text"::"public"."tax_lot_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."tax_lot_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tax_lot_status_enum_old" AS ENUM('available', 'sold', 'recalculating', 'ignored')`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ALTER COLUMN "status" TYPE "public"."tax_lot_status_enum_old" USING "status"::"text"::"public"."tax_lot_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."tax_lot_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."tax_lot_status_enum_old" RENAME TO "tax_lot_status_enum"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "status_reason"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "gain_loss_inclusion_status"`);
        await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_metadata_gain_loss_inclusion_status_enum"`);
    }

}
