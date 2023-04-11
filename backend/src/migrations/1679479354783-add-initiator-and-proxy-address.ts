import { MigrationInterface, QueryRunner } from "typeorm";

export class addInitiatorAndProxyAddress1679479354783 implements MigrationInterface {
    name = 'addInitiatorAndProxyAddress1679479354783'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_transaction_child" ADD "proxy_address" character varying`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_preprocess" ADD "initiator_address" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "financial_transaction_preprocess" DROP COLUMN "initiator_address"`);
        await queryRunner.query(`ALTER TABLE "financial_transaction_child" DROP COLUMN "proxy_address"`);
    }

}
