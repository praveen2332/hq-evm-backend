import { MigrationInterface, QueryRunner } from 'typeorm'

export class setDefaultCountryToOrg1680490248196 implements MigrationInterface {
  name = 'setDefaultCountryToOrg1680490248196'

  public async up(queryRunner: QueryRunner): Promise<void> {
    //set default Singapore country
    await queryRunner.query(`UPDATE organization_setting
                             set country_id = country.id
                             from (SELECT id
                                   FROM "country"
                                   WHERE iso3 = 'SGP') as country
                             where country_id is null`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
