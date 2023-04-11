import { MigrationInterface, QueryRunner } from 'typeorm'
import { CategoryType } from '../categories/interfaces'
import { systemCategories } from '../common/constants'

const editCategories = [
  {
    name: 'Sales',
    type: CategoryType.REVENUE,
    code: '200',
    descrition: 'Income from any normal business activity'
  },
  {
    name: 'Interest Income',
    type: CategoryType.REVENUE,
    code: '270',
    descrition: 'Interest income from amount paid to the business for lending or letting another entity use its funds'
  },
  {
    name: 'Other Income',
    type: CategoryType.REVENUE,
    code: '260',
    descrition: `Income that does not come from a company’s main business, such as rental income.`
  },

  {
    name: 'Advertising & Marketing',
    type: CategoryType.EXPENSE,
    code: '400',
    descrition: 'Expenses incurred for advertising while trying to increase sales'
  },
  {
    name: 'Entertainment',
    type: CategoryType.REVENUE,
    code: '420',
    descrition: 'Expenses paid by company for the business but are not deductable for income tax purposes.'
  },
  {
    name: 'Office Expenses',
    oldName: 'Office Expenses (e.g. cleaning, stationery)',
    type: CategoryType.EXPENSE,
    code: '453',
    descrition:
      'General expenses related to the running of the business office (e.g. Stationeries/Office Cleaning/Office Pantry)'
  },

  {
    name: 'Rent',
    type: CategoryType.EXPENSE,
    code: '469',
    descrition: 'The payment to lease a building or area.'
  },
  {
    name: 'Subscriptions',
    oldName: 'Subscriptions (e.g. publications)',
    type: CategoryType.EXPENSE,
    code: '485',
    descrition: 'Expenses related to subscriptions e.g. Publications/Software Subscriptions'
  },
  {
    name: 'Utilities',
    type: CategoryType.EXPENSE,
    code: '445',
    descrition: 'Expenses related to common utilities e.g. Telephone/Internet/Electricity/Water'
  },
  {
    name: 'Local Transport',
    oldName: 'Transport - Local',
    type: CategoryType.EXPENSE,
    code: '494',
    descrition: 'Expenses incurred from local travel which has a business purpose'
  },
  {
    name: 'Wages & Salaries',
    type: CategoryType.EXPENSE,
    code: '477',
    descrition: 'Payment to employees in exchange for their resources'
  }
]

export class UpdateRelation1668682674889 implements MigrationInterface {
  name = 'UpdateRelation1668682674889'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" ADD "code" character varying`)
    await queryRunner.query(`ALTER TABLE "category" ADD "description" character varying`)
    await queryRunner.query(`ALTER TABLE "category" ADD "organizationId" bigint`)
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "type"`)
    await queryRunner.query(`DROP TYPE "public"."category_type_enum"`)
    await queryRunner.query(`ALTER TABLE "category" ADD "type" character varying `)
    const oldCategories = editCategories.filter((category) => category.oldName)

    for (const category of oldCategories) {
      await queryRunner.query(
        `UPDATE "category" SET "name" = '${category.name}' WHERE "name" = '${category.oldName}' AND "organizationId" IS NULL`
      )
    }

    for (const category of editCategories) {
      await queryRunner.query(
        `UPDATE "category" SET "code" = '${category.code}', "description" = '${category.descrition}', "type" = '${category.type}' WHERE "name" = '${category.name}' AND "organizationId" IS NULL `
      )
    }

    for (const category of systemCategories) {
      const isExisted = await queryRunner.query(
        `SELECT * FROM "category" where "code" = '${category.code}' AND "organizationId" IS NULL`
      )
      if (isExisted && !isExisted.length) {
        await queryRunner.query(
          `INSERT INTO "category" ("name","code","description","type") VALUES ('${category.name}', '${category.code}','${category.descrition}', '${category.type}')`
        )
      }
    }

    const organizationIds = await queryRunner.query(`SELECT id FROM "organization"`)
    for (const organizationId of organizationIds) {
      for (const category of systemCategories) {
        const isExisted = await queryRunner.query(
          `SELECT * FROM "category" where "code" = '${category.code}' AND "organizationId" = '${organizationId.id}'`
        )
        if (isExisted && !isExisted.length) {
          await queryRunner.query(
            `INSERT INTO "category" ("name","code","description","type","organizationId") VALUES ('${category.name}', '${category.code}','${category.descrition}', '${category.type}','${organizationId.id}')`
          )
        }
      }
    }

    const oldCategoriesInDb = await queryRunner.query(
      `SELECT * FROM "category" WHERE "name" IN ('${editCategories
        .map((category) => category.name)
        .join(`','`)}') AND "organizationId" IS NULL `
    )

    for (const category of oldCategoriesInDb) {
      const transactionCategories = await queryRunner.query(
        `SELECT * FROM "transaction_category" WHERE "categoryId" = '${category.id}'`
      )

      for (const transactionCategory of transactionCategories) {
        const transactions = await queryRunner.query(
          `SELECT t."id", s."organization_id" FROM "transaction" t JOIN "source_of_fund" s ON s."id" = t."source_of_fund_id" WHERE t."id" = '${transactionCategory.transactionId}'`
        )

        for (const transaction of transactions) {
          const categoryInOrganization = await queryRunner.query(
            `SELECT id FROM "category"  WHERE "organizationId" = '${
              transaction.organization_id
            }' AND "name" IN ( SELECT "name" FROM "category" WHERE "id" = '${`${transactionCategory.categoryId}`}' )`
          )

          if (categoryInOrganization && categoryInOrganization[0])
            await queryRunner.query(
              `UPDATE "transaction_category" SET "categoryId" = '${categoryInOrganization[0].id}' WHERE "transactionId" = '${transaction.id}' `
            )
        }
      }
    }

    await queryRunner.query(`DELETE FROM "category" WHERE "code" IS NULL`)

    await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "code" SET NOT NULL `)
    await queryRunner.query(`DELETE FROM "category" WHERE "organizationId" IS NULL `)
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "UQ_8be00eed528ed60515f11c0d5e5" UNIQUE ("code", "organizationId")`
    )
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_e622399a6d565cafb9c754f093d" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "FK_e622399a6d565cafb9c754f093d"`)
    await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_8be00eed528ed60515f11c0d5e5"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "type"`)
    await queryRunner.query(`CREATE TYPE "public"."category_type_enum" AS ENUM('outgoing', 'incoming')`)
    await queryRunner.query(`ALTER TABLE "category" ADD "type" "public"."category_type_enum"`)
    await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`)
    await queryRunner.query(`ALTER TABLE "transaction" DROP COLUMN "files"`)
    await queryRunner.query(`ALTER TABLE "transaction" ADD "files" text array`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "organizationId"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "description"`)
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "code"`)
  }
}
