import { MigrationInterface, QueryRunner } from 'typeorm'

export class Init1652569272091 implements MigrationInterface {
  name = 'Init1652569272091'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "base_entity" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_03e6c58047b7a4b3f6de0bfa8d7" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organization_auth_provider_enum" AS ENUM('email', 'twitter', 'wallet')`
    )
    await queryRunner.query(
      `CREATE TABLE "organization_auth" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "auth_id" character varying NOT NULL, "provider" "public"."organization_auth_provider_enum" NOT NULL, "role_id" bigint, "organization_id" bigint, CONSTRAINT "PK_79f0fb80cbe1f4944420a060e02" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."role_name_enum" AS ENUM('Owner', 'Admin', 'Employee', 'Vendor', 'Auditor', 'Billing Manager')`
    )
    await queryRunner.query(
      `CREATE TABLE "role" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" "public"."role_name_enum" NOT NULL, "permissions" json NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."invitation_status_enum" AS ENUM('active', 'inactive', 'invited', 'rejected', 'expired')`
    )
    await queryRunner.query(
      `CREATE TABLE "invitation" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), "full_name" character varying NOT NULL, "email" character varying, "address" character varying, "expiredAt" TIMESTAMP NOT NULL, "status" "public"."invitation_status_enum" NOT NULL, "organization_id" bigint, "role_id" bigint, CONSTRAINT "UQ_8c2f1e39ddfe69f7c0a77c04248" UNIQUE ("public_id"), CONSTRAINT "PK_beb994737756c0f18a1c1f8669c" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."source_of_fund_source_type_enum" AS ENUM('FTX', 'Gnosis', 'Coinbase', 'CDC', 'ETH')`
    )
    await queryRunner.query(
      `CREATE TABLE "source_of_fund" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "source_id" character varying NOT NULL, "source_type" "public"."source_of_fund_source_type_enum" NOT NULL DEFAULT 'FTX', "organization_id" bigint, CONSTRAINT "PK_7d505a047d41ac5c1dd125e388a" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE TYPE "public"."organization_type_enum" AS ENUM('DAO', 'COMPANY')`)
    await queryRunner.query(
      `CREATE TABLE "organization" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "type" "public"."organization_type_enum" NOT NULL DEFAULT 'DAO', "public_id" uuid NOT NULL DEFAULT uuid_generate_v4(), CONSTRAINT "UQ_ff945c45c1ea7563136baf0a24d" UNIQUE ("public_id"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "contact_provider" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, CONSTRAINT "PK_02e63d58913b20e7bf911608efa" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "recipient_contact" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "content" character varying NOT NULL, "recipient_id" bigint, "contact_provider_id" bigint, CONSTRAINT "PK_86032c7328cedcddd5b1b591ae8" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE TYPE "public"."recipient_type_enum" AS ENUM('individual', 'organization')`)
    await queryRunner.query(
      `CREATE TABLE "recipient" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_name" character varying, "organization_address" character varying, "contact_name" character varying NOT NULL, "type" "public"."recipient_type_enum" NOT NULL, "organization_id" bigint, CONSTRAINT "PK_9f7a695711b2055e3c8d5cfcfa1" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "recipient_address" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "address" character varying NOT NULL, "recipient_id" bigint, "chainId" integer, "tokenId" integer, CONSTRAINT "PK_74ed0345bcf6dd02a33602e15cd" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "token" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_82fae97f905930df5d62a702fc9" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "auth_wallet" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "address" character varying NOT NULL, "nonce" character varying NOT NULL, "account_id" bigint, CONSTRAINT "UQ_b95f3ceeb66b83620603caa317a" UNIQUE ("address"), CONSTRAINT "UQ_b95f3ceeb66b83620603caa317a" UNIQUE ("address"), CONSTRAINT "PK_470bd72c171d8680030d87f277d" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "chain" ("id" integer NOT NULL, "name" character varying NOT NULL, "isTestnet" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_8e273aafae283b886672c952ecd" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "transaction" ("id" BIGSERIAL NOT NULL, "comment" character varying, "tags" text array, "hash" character varying, "safe_hash" character varying, "time_stamp" TIMESTAMP, "is_executed" boolean NOT NULL, "submission_date" TIMESTAMP, "metamask_transaction" json, "safe_transaction" json, "is_draft" boolean, "chain_id" integer, "source_of_fund_id" bigint, "tx_creator" bigint, CONSTRAINT "UQ_7b3fac1b0e99af45b3209e9a096" UNIQUE ("hash", "safe_hash", "source_of_fund_id"), CONSTRAINT "PK_89eadb93a89810556e1cbcd6ab9" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE INDEX "IDX_7b3fac1b0e99af45b3209e9a09" ON "transaction" ("hash", "safe_hash", "source_of_fund_id") `
    )
    await queryRunner.query(
      `CREATE TABLE "auth_email" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying, "verifierId" character varying NOT NULL, "account_id" bigint, CONSTRAINT "UQ_e44b6c4f9f432ab963f66752a1b" UNIQUE ("email"), CONSTRAINT "UQ_20a09656f77c60b9008ff82c77d" UNIQUE ("verifierId"), CONSTRAINT "PK_8bc3f601d024f5de30c19bc4da8" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_20a09656f77c60b9008ff82c77" ON "auth_email" ("verifierId") `)
    await queryRunner.query(
      `CREATE TABLE "auth_twitter" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "email" character varying, "verifierId" character varying NOT NULL, "account_id" bigint, CONSTRAINT "UQ_b46f714a3f4bc94d0f013416aef" UNIQUE ("email"), CONSTRAINT "UQ_90a73ff11ff17052b0d08498017" UNIQUE ("verifierId"), CONSTRAINT "PK_dbb7a21083bd5b23f0c4c16e3c7" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_90a73ff11ff17052b0d0849801" ON "auth_twitter" ("verifierId") `)
    await queryRunner.query(
      `CREATE TABLE "account" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "image" character varying, "active_organization_id" character varying, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "group" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organizationId" character varying NOT NULL, "name" character varying NOT NULL, "description" character varying, CONSTRAINT "UQ_82075bcad8212da193f04f417fe" UNIQUE ("organizationId", "name"), CONSTRAINT "PK_256aa0fda9b1de1a73ee0b7106b" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "invoice" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "invoice_number" character varying NOT NULL, "from" json NOT NULL, "to" json NOT NULL, "information" character varying, "recipient" character varying, "network" character varying, "items" json NOT NULL, CONSTRAINT "PK_15d25c200d9bcd8a33f698daf18" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "source_cdc" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" character varying NOT NULL, "api_key" character varying NOT NULL, "secret_key" character varying NOT NULL, CONSTRAINT "PK_e0676e9bd19038fa61872ce69b8" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "source_coinbase" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" character varying NOT NULL, "access_token" character varying NOT NULL, "refresh_token" character varying NOT NULL, "expiry_date" TIMESTAMP NOT NULL, CONSTRAINT "PK_53da32f7b69fec086b1f78f3eb3" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "source_eth" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" character varying NOT NULL, "address" character varying NOT NULL, "chain_id" integer NOT NULL, CONSTRAINT "UQ_c9f5485fe322964aa62b9fc30b2" UNIQUE ("organization_id", "address"), CONSTRAINT "PK_50f3bb45749d3b51aed218bbc82" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "source_ftx" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" character varying NOT NULL, "api_key" character varying NOT NULL, "secret_key" character varying NOT NULL, "sub_account_name" character varying NOT NULL, CONSTRAINT "PK_b6c87a449acdc0c74ab5f6461b8" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "source_gnosis" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "organization_id" character varying NOT NULL, "address" character varying NOT NULL, "chain_id" integer NOT NULL, "threshold" integer NOT NULL, "owner_addresses" json NOT NULL, CONSTRAINT "UQ_b4eb165b924ee29456f35521f7e" UNIQUE ("organization_id", "address"), CONSTRAINT "PK_92ec7e79cb9fe7dfaa8240b3d29" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE TABLE "wallet_chain" ("chainId" integer NOT NULL, "authWalletId" bigint NOT NULL, CONSTRAINT "PK_95bccf4bfa57eaa12ae61a2374f" PRIMARY KEY ("chainId", "authWalletId"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_bf25228dd543272f1f474a8765" ON "wallet_chain" ("chainId") `)
    await queryRunner.query(`CREATE INDEX "IDX_adccd79b0069a3d07b548fa1c4" ON "wallet_chain" ("authWalletId") `)
    await queryRunner.query(
      `CREATE TABLE "supported_tokens" ("chainId" integer NOT NULL, "tokenId" integer NOT NULL, CONSTRAINT "PK_730c844c37d134f397989f5df82" PRIMARY KEY ("chainId", "tokenId"))`
    )
    await queryRunner.query(`CREATE INDEX "IDX_3e56c06650c4d29aeb85c7ba5c" ON "supported_tokens" ("chainId") `)
    await queryRunner.query(`CREATE INDEX "IDX_d9eaec532ce601e683c7145a74" ON "supported_tokens" ("tokenId") `)
    await queryRunner.query(
      `ALTER TABLE "organization_auth" ADD CONSTRAINT "FK_3083be24fbfff5da15616c6b5e3" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_auth" ADD CONSTRAINT "FK_2f5b1734ae2c57addfabe172550" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "invitation" ADD CONSTRAINT "FK_de7c148c7834d738ac7113f3dd8" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "invitation" ADD CONSTRAINT "FK_40ff1c000f96e3b25c2f4762008" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "source_of_fund" ADD CONSTRAINT "FK_1d7fdeb0632cb44f0d750e8629e" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient_contact" ADD CONSTRAINT "FK_e67f6a5b094148990c08d668847" FOREIGN KEY ("recipient_id") REFERENCES "recipient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient_contact" ADD CONSTRAINT "FK_82ff34ab8f80f2353cd79c0a849" FOREIGN KEY ("contact_provider_id") REFERENCES "contact_provider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient" ADD CONSTRAINT "FK_09f3c76753c86c834d7ab3350ca" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient_address" ADD CONSTRAINT "FK_2c20412ba9f1452c87e77d37160" FOREIGN KEY ("recipient_id") REFERENCES "recipient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient_address" ADD CONSTRAINT "FK_2e026b228399ffcb3b60e6fa77b" FOREIGN KEY ("chainId") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "recipient_address" ADD CONSTRAINT "FK_c8ec809937fc613c213c75ce269" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "auth_wallet" ADD CONSTRAINT "FK_2e69baf0941202150038287c9a5" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_7c97ebb75babc89801222b40893" FOREIGN KEY ("source_of_fund_id") REFERENCES "source_of_fund"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "transaction" ADD CONSTRAINT "FK_a0868ed2a8083fbbb63d464d44e" FOREIGN KEY ("tx_creator") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "auth_email" ADD CONSTRAINT "FK_ff52fdf560efacd0c2f4fa22427" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "auth_twitter" ADD CONSTRAINT "FK_1ba21add88306ef610919944a5e" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "wallet_chain" ADD CONSTRAINT "FK_bf25228dd543272f1f474a87650" FOREIGN KEY ("chainId") REFERENCES "chain"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE "wallet_chain" ADD CONSTRAINT "FK_adccd79b0069a3d07b548fa1c41" FOREIGN KEY ("authWalletId") REFERENCES "auth_wallet"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "supported_tokens" ADD CONSTRAINT "FK_3e56c06650c4d29aeb85c7ba5c5" FOREIGN KEY ("chainId") REFERENCES "chain"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    )
    await queryRunner.query(
      `ALTER TABLE "supported_tokens" ADD CONSTRAINT "FK_d9eaec532ce601e683c7145a74a" FOREIGN KEY ("tokenId") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supported_tokens" DROP CONSTRAINT "FK_d9eaec532ce601e683c7145a74a"`)
    await queryRunner.query(`ALTER TABLE "supported_tokens" DROP CONSTRAINT "FK_3e56c06650c4d29aeb85c7ba5c5"`)
    await queryRunner.query(`ALTER TABLE "wallet_chain" DROP CONSTRAINT "FK_adccd79b0069a3d07b548fa1c41"`)
    await queryRunner.query(`ALTER TABLE "wallet_chain" DROP CONSTRAINT "FK_bf25228dd543272f1f474a87650"`)
    await queryRunner.query(`ALTER TABLE "auth_twitter" DROP CONSTRAINT "FK_1ba21add88306ef610919944a5e"`)
    await queryRunner.query(`ALTER TABLE "auth_email" DROP CONSTRAINT "FK_ff52fdf560efacd0c2f4fa22427"`)
    await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_a0868ed2a8083fbbb63d464d44e"`)
    await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_7c97ebb75babc89801222b40893"`)
    await queryRunner.query(`ALTER TABLE "transaction" DROP CONSTRAINT "FK_45d29ac87dac85293d3c4ab6bda"`)
    await queryRunner.query(`ALTER TABLE "auth_wallet" DROP CONSTRAINT "FK_2e69baf0941202150038287c9a5"`)
    await queryRunner.query(`ALTER TABLE "recipient_address" DROP CONSTRAINT "FK_c8ec809937fc613c213c75ce269"`)
    await queryRunner.query(`ALTER TABLE "recipient_address" DROP CONSTRAINT "FK_2e026b228399ffcb3b60e6fa77b"`)
    await queryRunner.query(`ALTER TABLE "recipient_address" DROP CONSTRAINT "FK_2c20412ba9f1452c87e77d37160"`)
    await queryRunner.query(`ALTER TABLE "recipient" DROP CONSTRAINT "FK_09f3c76753c86c834d7ab3350ca"`)
    await queryRunner.query(`ALTER TABLE "recipient_contact" DROP CONSTRAINT "FK_82ff34ab8f80f2353cd79c0a849"`)
    await queryRunner.query(`ALTER TABLE "recipient_contact" DROP CONSTRAINT "FK_e67f6a5b094148990c08d668847"`)
    await queryRunner.query(`ALTER TABLE "source_of_fund" DROP CONSTRAINT "FK_1d7fdeb0632cb44f0d750e8629e"`)
    await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_40ff1c000f96e3b25c2f4762008"`)
    await queryRunner.query(`ALTER TABLE "invitation" DROP CONSTRAINT "FK_de7c148c7834d738ac7113f3dd8"`)
    await queryRunner.query(`ALTER TABLE "organization_auth" DROP CONSTRAINT "FK_2f5b1734ae2c57addfabe172550"`)
    await queryRunner.query(`ALTER TABLE "organization_auth" DROP CONSTRAINT "FK_3083be24fbfff5da15616c6b5e3"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_d9eaec532ce601e683c7145a74"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_3e56c06650c4d29aeb85c7ba5c"`)
    await queryRunner.query(`DROP TABLE "supported_tokens"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_adccd79b0069a3d07b548fa1c4"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_bf25228dd543272f1f474a8765"`)
    await queryRunner.query(`DROP TABLE "wallet_chain"`)
    await queryRunner.query(`DROP TABLE "source_gnosis"`)
    await queryRunner.query(`DROP TABLE "source_ftx"`)
    await queryRunner.query(`DROP TABLE "source_eth"`)
    await queryRunner.query(`DROP TABLE "source_coinbase"`)
    await queryRunner.query(`DROP TABLE "source_cdc"`)
    await queryRunner.query(`DROP TABLE "invoice"`)
    await queryRunner.query(`DROP TABLE "group"`)
    await queryRunner.query(`DROP TABLE "account"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_90a73ff11ff17052b0d0849801"`)
    await queryRunner.query(`DROP TABLE "auth_twitter"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_20a09656f77c60b9008ff82c77"`)
    await queryRunner.query(`DROP TABLE "auth_email"`)
    await queryRunner.query(`DROP INDEX "public"."IDX_7b3fac1b0e99af45b3209e9a09"`)
    await queryRunner.query(`DROP TABLE "transaction"`)
    await queryRunner.query(`DROP TABLE "chain"`)
    await queryRunner.query(`DROP TABLE "auth_wallet"`)
    await queryRunner.query(`DROP TABLE "token"`)
    await queryRunner.query(`DROP TABLE "recipient_address"`)
    await queryRunner.query(`DROP TABLE "recipient"`)
    await queryRunner.query(`DROP TYPE "public"."recipient_type_enum"`)
    await queryRunner.query(`DROP TABLE "recipient_contact"`)
    await queryRunner.query(`DROP TABLE "contact_provider"`)
    await queryRunner.query(`DROP TABLE "organization"`)
    await queryRunner.query(`DROP TYPE "public"."organization_type_enum"`)
    await queryRunner.query(`DROP TABLE "source_of_fund"`)
    await queryRunner.query(`DROP TYPE "public"."source_of_fund_source_type_enum"`)
    await queryRunner.query(`DROP TABLE "invitation"`)
    await queryRunner.query(`DROP TYPE "public"."invitation_status_enum"`)
    await queryRunner.query(`DROP TABLE "role"`)
    await queryRunner.query(`DROP TYPE "public"."role_name_enum"`)
    await queryRunner.query(`DROP TABLE "organization_auth"`)
    await queryRunner.query(`DROP TYPE "public"."organization_auth_provider_enum"`)
    await queryRunner.query(`DROP TABLE "base_entity"`)
  }
}
