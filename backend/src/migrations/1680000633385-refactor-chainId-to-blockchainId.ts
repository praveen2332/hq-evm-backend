import { MigrationInterface, QueryRunner } from 'typeorm'

const TABLE_NAMES_WITH_CHAIN_ID = [
  'additional_transformation_task',
  'core_transformation_task',
  'cryptocurrency_address',
  'financial_transaction_parent',
  'financial_transaction_child',
  'financial_transaction_preprocess',
  'tax_lot_sale',
  'tax_lot',
  'ingestion_task',
  'preprocess_raw_task',
  'raw_transaction',
  'transaction',
  'source_gnosis',
  'source_eth',
  'payment_link'
]

const TABLE_NAMES_WITH_CHAINID = ['member_address', 'recipient_address']

export class refactorChainIdToBlockchainId1680000633385 implements MigrationInterface {
  name = 'refactorChainIdToBlockchainId1680000633385'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."UQ_raw_transaction_hash_chainId_address"`)
    await queryRunner.query(`ALTER TABLE "member_address" DROP CONSTRAINT "FK_1cec54b90aa31fc7c68e8b28ce3"`)
    await queryRunner.query(`ALTER TABLE "recipient_address" DROP CONSTRAINT "FK_2e026b228399ffcb3b60e6fa77b"`)
    await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda"`)
    await queryRunner.query(`ALTER TABLE "payment_link" DROP CONSTRAINT "FK_0192cee4f1c58d580dfe57e97cb"`)

    for (const tableName of TABLE_NAMES_WITH_CHAIN_ID) {
      await queryRunner.query(`ALTER TABLE ${tableName} ADD "blockchain_id" character varying`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'ethereum' where "chain_id" = '1'`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'rinkeby' where "chain_id" = '4'`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'goerli' where "chain_id" = '5'`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'polygon' where "chain_id" = '137'`)
      await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN "chain_id"`)
      if (!['transaction', 'source_gnosis', 'source_eth'].includes(tableName)) {
        await queryRunner.query(`ALTER TABLE ${tableName} ALTER COLUMN "blockchain_id" SET NOT NULL`)
      }
    }

    for (const tableName of TABLE_NAMES_WITH_CHAINID) {
      await queryRunner.query(`ALTER TABLE ${tableName} ADD "blockchain_id" character varying`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'ethereum' where "chainId" = '1'`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'rinkeby' where "chainId" = '4'`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'goerli' where "chainId" = '5'`)
      await queryRunner.query(`UPDATE ${tableName} SET "blockchain_id" = 'polygon' where "chainId" = '137'`)
      await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN "chainId"`)
      await queryRunner.query(`ALTER TABLE ${tableName} ALTER COLUMN "blockchain_id" SET NOT NULL`)
    }

    await queryRunner.query(`UPDATE "wallet" SET "status_per_chain" = null`)
    await queryRunner.query(`UPDATE "wallet" SET "balance" = null`)
    await queryRunner.query(
      `CREATE TABLE "blockchain" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" character varying NOT NULL, "name" character varying NOT NULL, "chain_id" character varying, "is_enabled" boolean NOT NULL, "is_testnet" boolean NOT NULL, "block_explorer" character varying, "api_url" character varying, "image_url" character varying, CONSTRAINT "UQ_beb00fae053f35fbe1863b12b42" UNIQUE ("public_id"), CONSTRAINT "PK_e8d1216086807f2eb4cc145b3a2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `INSERT INTO "blockchain" ("created_at", "updated_at", "deleted_at", "public_id", "name", "chain_id", "is_enabled", "is_testnet", "block_explorer", "api_url", "image_url") VALUES (DEFAULT, DEFAULT, DEFAULT, 'ethereum', 'Ethereum Mainnet', '1', 'true', 'false', 'https://etherscan.io/', 'https://api.etherscan.io/', 'https://hq-backend-dev-public.s3.ap-southeast-1.amazonaws.com/blockchain-images/ethereum.png')`
    )
    await queryRunner.query(
      `INSERT INTO "blockchain" ("created_at", "updated_at", "deleted_at", "public_id", "name", "chain_id", "is_enabled", "is_testnet", "block_explorer", "api_url", "image_url") VALUES (DEFAULT, DEFAULT, DEFAULT, 'goerli', 'Goerli', '5', 'false', 'true', 'https://goerli.etherscan.io/', 'https://api-goerli.etherscan.io/', 'https://hq-backend-dev-public.s3.ap-southeast-1.amazonaws.com/blockchain-images/goerli.png' )`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_raw_transaction_hash_blockchainId_address" ON "raw_transaction" ("hash", "blockchain_id", "address") `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "blockchain"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_raw_transaction_hash_blockchainId_address"`)
    for (const tableName of TABLE_NAMES_WITH_CHAIN_ID) {
      await queryRunner.query(`ALTER TABLE ${tableName} ADD chain_id bigint`)
      await queryRunner.query(`UPDATE ${tableName} SET "chain_id" = '1' where "blockchain_id" = 'ethereum'`)
      await queryRunner.query(`UPDATE ${tableName} SET "chain_id" = '4' where "blockchain_id" = 'rinkeby'`)
      await queryRunner.query(`UPDATE ${tableName} SET "chain_id" = '5' where "blockchain_id" = 'goerli'`)
      await queryRunner.query(`UPDATE ${tableName} SET "chain_id" = '137' where "blockchain_id" = 'polygon'`)
      await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN "blockchain_id"`)
      if (!['transaction', 'source_gnosis', 'source_eth'].includes(tableName)) {
        await queryRunner.query(`ALTER TABLE ${tableName} ALTER COLUMN "chain_id" SET NOT NULL`)
      }
    }

    for (const tableName of TABLE_NAMES_WITH_CHAINID) {
      await queryRunner.query(`ALTER TABLE ${tableName} ADD "chainId" bigint`)
      await queryRunner.query(`UPDATE ${tableName} SET "chainId" = '1' where "blockchain_id" = 'ethereum'`)
      await queryRunner.query(`UPDATE ${tableName} SET "chainId" = '4' where "blockchain_id" = 'rinkeby'`)
      await queryRunner.query(`UPDATE ${tableName} SET "chainId" = '5' where "blockchain_id" = 'goerli'`)
      await queryRunner.query(`UPDATE ${tableName} SET "chainId" = '137' where "blockchain_id" = 'polygon'`)
      await queryRunner.query(`ALTER TABLE ${tableName} DROP COLUMN "blockchain_id"`)
      await queryRunner.query(`ALTER TABLE ${tableName} ALTER COLUMN "chainId" SET NOT NULL`)
    }

    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient_address" ADD CONSTRAINT "FK_2e026b228399ffcb3b60e6fa77b" FOREIGN KEY ("chainId") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member_address" ADD CONSTRAINT "FK_1cec54b90aa31fc7c68e8b28ce3" FOREIGN KEY ("chainId") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment_link" ADD CONSTRAINT "FK_0192cee4f1c58d580dfe57e97cb" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(`UPDATE "wallet" SET "status_per_chain" = null`)
    await queryRunner.query(`UPDATE "wallet" SET "balance" = null`)
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_raw_transaction_hash_chainId_address" ON "raw_transaction" ("hash", "address", "chain_id") `
    )
  }
}
