import { MigrationInterface, QueryRunner } from 'typeorm'

export class changeTokenToCryptocurrencyForPaymentLinks1675742839309 implements MigrationInterface {
  name = 'changeTokenToCryptocurrencyForPaymentLinks1675742839309'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link" DROP CONSTRAINT "FK_3df0f053f8dc870ccdc5721632b"`)
    await queryRunner.query(`ALTER TABLE "payment_link" RENAME COLUMN "token_id" TO "cryptocurrency_id"`)
    await queryRunner.query(`ALTER TABLE "payment_link" DROP COLUMN "cryptocurrency_id"`)
    await queryRunner.query(`ALTER TABLE "payment_link" ADD "cryptocurrency_id" bigint`)
    await queryRunner.query(
      `ALTER TABLE "cryptocurrency_address" ADD CONSTRAINT "FK_a4ced3d33e3371660487509b891" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "cryptocurrency_address" ADD CONSTRAINT "FK_329c627f2043ebc491e40767d92" FOREIGN KEY ("chain_id") REFERENCES "chain"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "payment_link" ADD CONSTRAINT "FK_8a0babc529552506faff4337086" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payment_link" DROP CONSTRAINT "FK_8a0babc529552506faff4337086"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" DROP CONSTRAINT "FK_329c627f2043ebc491e40767d92"`)
    await queryRunner.query(`ALTER TABLE "cryptocurrency_address" DROP CONSTRAINT "FK_a4ced3d33e3371660487509b891"`)
    await queryRunner.query(`ALTER TABLE "payment_link" DROP COLUMN "cryptocurrency_id"`)
    await queryRunner.query(`ALTER TABLE "payment_link" ADD "cryptocurrency_id" integer`)
    await queryRunner.query(`ALTER TABLE "payment_link" RENAME COLUMN "cryptocurrency_id" TO "token_id"`)
    await queryRunner.query(
      `ALTER TABLE "payment_link" ADD CONSTRAINT "FK_3df0f053f8dc870ccdc5721632b" FOREIGN KEY ("token_id") REFERENCES "token"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }
}
