import { MigrationInterface, QueryRunner } from "typeorm";

export class addPreviousTaxLotSaleIdToTaxLot1680602926595 implements MigrationInterface {
    name = 'addPreviousTaxLotSaleIdToTaxLot1680602926595'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "additional_transformation_task" RENAME COLUMN "wallet_group_id" TO "wallet_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot_sale" RENAME COLUMN "wallet_group_id" TO "wallet_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "wallet_group_id"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "direction" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "transferred_at" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "wallet_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "previous_tax_lot_sale_id" character varying`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_parent" DROP COLUMN "activity"`);
        await queryRunner.query(`DROP TYPE "public"."financial_transaction_parent_activity_enum"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_parent" ADD "activity" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_metadata_type_enum"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "type" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP CONSTRAINT "UQ_tax_lot_financial_transaction_child_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "public_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "public_id" uuid NOT NULL DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD CONSTRAINT "UQ_ebf501bd7b85192e590fdb916d2" UNIQUE ("public_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP CONSTRAINT "UQ_ebf501bd7b85192e590fdb916d2"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "public_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "public_id" character varying`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD CONSTRAINT "UQ_tax_lot_financial_transaction_child_id" UNIQUE ("financial_transaction_child_id")`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."financial_transaction_child_metadata_type_enum" AS ENUM('deposit', 'withdrawal', 'fee', 'internal_transfer', 'group_transfer')`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "type" "public"."financial_transaction_child_metadata_type_enum"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_parent" DROP COLUMN "activity"`);
        await queryRunner.query(`CREATE TYPE "public"."financial_transaction_parent_activity_enum" AS ENUM('transfer', 'swap', 'off_ramp', 'on_ramp', 'mint', 'burn', 'contract_interaction')`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_parent" ADD "activity" "public"."financial_transaction_parent_activity_enum" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "previous_tax_lot_sale_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "wallet_id"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" DROP COLUMN "transferred_at"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "direction"`);
        await queryRunner.query(`ALTER TABLE "tax_lot" ADD "wallet_group_id" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tax_lot_sale" RENAME COLUMN "wallet_id" TO "wallet_group_id"`);
        await queryRunner.query(`ALTER TABLE "additional_transformation_task" RENAME COLUMN "wallet_id" TO "wallet_group_id"`);
    }

}
