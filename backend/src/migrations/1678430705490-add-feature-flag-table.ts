import { MigrationInterface, QueryRunner } from "typeorm";

export class addFeatureFlagTable1678430705490 implements MigrationInterface {
    name = 'addFeatureFlagTable1678430705490'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "feature_flag" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "is_enabled" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_feature_flag_name" UNIQUE ("name"), CONSTRAINT "PK_f390205410d884907604a90c0f4" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "feature_flag"`);
    }

}
