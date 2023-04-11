import { MigrationInterface, QueryRunner } from "typeorm";

export class addLastSyncedAtToWallet1679903079938 implements MigrationInterface {
    name = 'addLastSyncedAtToWallet1679903079938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallet" ADD "last_synced_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "gain_loss_inclusion_status"`);
        await queryRunner.query(`DROP TYPE "public"."financial_transaction_child_metadata_gain_loss_inclusion_status"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "gain_loss_inclusion_status" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" DROP COLUMN "gain_loss_inclusion_status"`);
        await queryRunner.query(`CREATE TYPE "public"."financial_transaction_child_metadata_gain_loss_inclusion_status" AS ENUM('all', 'none', 'purchase_only', 'sell_only')`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child_metadata" ADD "gain_loss_inclusion_status" "public"."financial_transaction_child_metadata_gain_loss_inclusion_status" NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wallet" DROP COLUMN "last_synced_at"`);
    }

}
