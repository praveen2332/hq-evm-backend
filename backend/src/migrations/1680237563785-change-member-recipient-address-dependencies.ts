import { MigrationInterface, QueryRunner } from 'typeorm'

export class changeMemberRecipientAddressDependencies1680237563785 implements MigrationInterface {
  name = 'changeMemberRecipientAddressDependencies1680237563785'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "recipient_address" ADD "cryptocurrency_id" bigint`)
    await queryRunner.query(`ALTER TABLE "member_address" ADD "cryptocurrency_id" bigint`)
    await queryRunner.query(
      `ALTER TABLE "recipient_address" ADD CONSTRAINT "FK_217f326b78cca20b92db9c69dc6" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "member_address" ADD CONSTRAINT "FK_733fbbf783edff6b6fe5070f309" FOREIGN KEY ("cryptocurrency_id") REFERENCES "cryptocurrency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    // populate member_address.cryptocurrency_id
    await queryRunner.query(
      `
        UPDATE member_address
        SET cryptocurrency_id=subquery.crypto_id
        FROM (select t.name, c.symbol, c.id as crypto_id, addr.id
              from member_address addr,
                   token t,
                   cryptocurrency c
              where addr.member_profile_id is not null
                and addr.cryptocurrency_id is null
                and addr."tokenId" is not null
                and t.id = addr."tokenId"
                and c.symbol = t.name) AS subquery
        WHERE member_address.id = subquery.id;
      `
    )

    // populate member_address.cryptocurrency_id
    await queryRunner.query(
      `
        UPDATE member_address
        SET cryptocurrency_id=subquery.crypto_id
        FROM (select t.name, c.symbol, c.id as crypto_id, addr.id
              from member_address addr,
                   token t,
                   cryptocurrency c
              where addr.cryptocurrency_id is null
                and addr."tokenId" is not null
                and t.id = addr."tokenId"
                and c.symbol = t.name) AS subquery
        WHERE member_address.id = subquery.id
      `
    )
    // populate recipient_address.cryptocurrency_id
    await queryRunner.query(
      `
        UPDATE recipient_address
        SET cryptocurrency_id=subquery.crypto_id
        FROM (select t.name, c.symbol, c.id as crypto_id, addr.id
              from recipient_address addr,
                   token t,
                   cryptocurrency c
              where addr.cryptocurrency_id is null
                and addr."tokenId" is not null
                and t.id = addr."tokenId"
                and c.symbol = t.name) AS subquery
        WHERE recipient_address.id = subquery.id
      `
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "member_address" DROP CONSTRAINT "FK_733fbbf783edff6b6fe5070f309"`)
    await queryRunner.query(`ALTER TABLE "recipient_address" DROP CONSTRAINT "FK_217f326b78cca20b92db9c69dc6"`)
    await queryRunner.query(`ALTER TABLE "member_address" DROP COLUMN "cryptocurrency_id"`)
    await queryRunner.query(`ALTER TABLE "recipient_address" DROP COLUMN "cryptocurrency_id"`)
  }
}
