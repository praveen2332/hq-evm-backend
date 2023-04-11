import { MigrationInterface, QueryRunner } from 'typeorm'

const outgointCategories = [
  'Advertising & Marketing',
  'Entertainment',
  'Equipment',
  'Food & Beverage',
  'Freight & Courier',
  'Office Expenses (e.g. cleaning, stationery)',
  'Payments to Service Providers & Suppliers',
  'Rent',
  'Software',
  'Subscriptions (e.g. publications)',
  'Telephone & Internet',
  'Training',
  'Transport - Local',
  'Travel - International',
  'Utilities',
  'Wages & Salaries',
  'Other Expenses'
]

const incomingCategories = ['Sales', 'Interest Income', 'Other Income', 'Refunds', 'Reimbursement']

export class CategorySeed1663655954775 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM "category"')
    for (const category of incomingCategories) {
      queryRunner.query(
        `INSERT INTO "category"("name", "type", "created_at", "updated_at", "deleted_at") VALUES ('${category}', 'incoming', DEFAULT, DEFAULT, DEFAULT)`
      )
    }

    for (const category of outgointCategories) {
      queryRunner.query(
        `INSERT INTO "category"("name", "type", "created_at", "updated_at", "deleted_at") VALUES ('${category}', 'outgoing', DEFAULT, DEFAULT, DEFAULT)`
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
