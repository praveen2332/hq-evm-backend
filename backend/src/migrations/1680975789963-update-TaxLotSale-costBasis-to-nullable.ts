import { MigrationInterface, QueryRunner } from 'typeorm'

export class updateTaxLotSaleCostBasisToNullable1680975789963 implements MigrationInterface {
  name = 'updateTaxLotSaleCostBasisToNullable1680975789963'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" ALTER COLUMN "cost_basis_amount" DROP NOT NULL`)
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" ALTER COLUMN "cost_basis_per_unit" DROP NOT NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" ALTER COLUMN "cost_basis_per_unit" SET NOT NULL`)
    await queryRunner.query(`ALTER TABLE "tax_lot_sale" ALTER COLUMN "cost_basis_amount" SET NOT NULL`)
  }
}
