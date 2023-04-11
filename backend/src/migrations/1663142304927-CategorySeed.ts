import { MigrationInterface, QueryRunner } from 'typeorm'

const categories = [
  'Sales',
  'Interest Income',
  'Other Income',
  'Advertising & Marketing',
  'Entertainment',
  'Equipment',
  'Food & Beverage (e.g. meals)',
  'Freight & Courier',
  'Office Expenses (e.g. cleaning, stationery)',
  'Payments to Suppliers',
  'Rent',
  'Repairs & Maintenance',
  'Software',
  'Subscriptions (e.g. publications)',
  'Telephone & Internet',
  'Transport - Local',
  'Travel - International',
  'Utilities',
  'Wages & Salaries'
]

export class CategorySeed1663142304927 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const category of categories) {
      queryRunner.query(
        `INSERT INTO "category"("name", "created_at", "updated_at", "deleted_at") VALUES ('${category}', DEFAULT, DEFAULT, DEFAULT)`
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
