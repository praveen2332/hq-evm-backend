import { MigrationInterface, QueryRunner } from 'typeorm'
import { CryptocurrencyType } from '../common/services/cryptocurrencies/interfaces'

const cryptocurrency = [
  { name: 'Ethereum', symbol: 'ETH', decimals: 18, coingecko_id: 'ethereum' },
  { name: 'USD Coin', symbol: 'USDC', decimals: 6, coingecko_id: 'usd-coin' },
  { name: 'Polygon', symbol: 'MATIC', decimals: 18, coingecko_id: 'matic-network' },
  { name: 'XSGD', symbol: 'XSGD', decimals: 6, coingecko_id: 'xsgd' },
  { name: 'XIDR', symbol: 'XIDR', decimals: 6, coingecko_id: 'straitsx-indonesia-rupiah' },
  { name: 'Tether', symbol: 'USDT', decimals: 6, coingecko_id: 'tether' },
  { name: 'Dai', symbol: 'DAI', decimals: 18, coingecko_id: 'dai' }
]

const ETHEREUM_CHAIN_ID = 1
const GOERLI_CHAIN_ID = 5

const cryptocurrencyAddress = {
  ETH: [
    { chain_id: ETHEREUM_CHAIN_ID, type: CryptocurrencyType.COIN },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.COIN }
  ],
  USDC: [
    {
      chain_id: ETHEREUM_CHAIN_ID,
      type: CryptocurrencyType.TOKEN,
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.TOKEN, address: '0x07865c6e87b9f70255377e024ace6630c1eaa37f' }
  ],
  MATIC: [
    {
      chain_id: ETHEREUM_CHAIN_ID,
      type: CryptocurrencyType.TOKEN,
      address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0'
    },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.TOKEN, address: '0xa108830a23a9a054fff4470a8e6292da0886a4d4' }
  ],
  XSGD: [
    {
      chain_id: ETHEREUM_CHAIN_ID,
      type: CryptocurrencyType.TOKEN,
      address: '0x70e8de73ce538da2beed35d14187f6959a8eca96'
    },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.TOKEN, address: '0x74298183a2a5460b1240ff43cc3c3e8327ea83e6' }
  ],
  XIDR: [
    {
      chain_id: ETHEREUM_CHAIN_ID,
      type: CryptocurrencyType.TOKEN,
      address: '0xebf2096e01455108badcbaf86ce30b6e5a72aa52'
    },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.TOKEN, address: '0xc039e7f1e44384f207948e9ff12e345cab3fa30c' }
  ],
  USDT: [
    {
      chain_id: ETHEREUM_CHAIN_ID,
      type: CryptocurrencyType.TOKEN,
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7'
    },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.TOKEN, address: '0xac63d1ae50ef9860508d5fc21fcda7aff8db524a' }
  ],
  DAI: [
    {
      chain_id: ETHEREUM_CHAIN_ID,
      type: CryptocurrencyType.TOKEN,
      address: '0x6b175474e89094c44da98b954eedeac495271d0f'
    },
    { chain_id: GOERLI_CHAIN_ID, type: CryptocurrencyType.TOKEN, address: '0xf2edf1c091f683e3fb452497d9a98a49cba84666' }
  ]
}

export class AddCryptocurrencyTable1675235885407 implements MigrationInterface {
  name = 'AddCryptocurrencyTable1675235885407'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "public"."cryptocurrency_address_type_enum" AS ENUM('Coin', 'Token')`)
    await queryRunner.query(
      `CREATE TABLE "cryptocurrency_address" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type" "public"."cryptocurrency_address_type_enum" NOT NULL, "address" character varying, "cryptocurrency_id" bigint, "chain_id" integer, CONSTRAINT "PK_f6852cf797e5174b5fa66a9a834" PRIMARY KEY ("id"))`
    )
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_cryptocurrency_address_chain_type_address" ON "cryptocurrency_address" ("type", "address") `
    )
    await queryRunner.query(
      `CREATE TABLE "cryptocurrency" ("id" BIGSERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "name" character varying NOT NULL, "symbol" character varying NOT NULL, "decimal" integer NOT NULL, "coingecko_id" character varying NOT NULL, CONSTRAINT "PK_8d1a4026dac40b9af2cf3ef72b4" PRIMARY KEY ("id"))`
    )

    cryptocurrency.map(
      async (entry) =>
        await queryRunner.query(
          `INSERT INTO "cryptocurrency"("created_at", "updated_at", "deleted_at", "name", "symbol", "decimal", "coingecko_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${entry.name}', '${entry.symbol}','${entry.decimals}','${entry.coingecko_id}')`
        )
    )

    for (const [symbol, addresses] of Object.entries(cryptocurrencyAddress)) {
      const cryptocurrency = await queryRunner.query(`SELECT id FROM "cryptocurrency" WHERE "symbol" = '${symbol}'`)
      for (const addr of addresses) {
        if ('address' in addr) {
          await queryRunner.query(
            `INSERT INTO "cryptocurrency_address"("created_at", "updated_at", "deleted_at", "type", "address","cryptocurrency_id", "chain_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${addr.type}','${addr['address']}','${cryptocurrency[0].id}', '${addr.chain_id}')`
          )
        } else {
          await queryRunner.query(
            `INSERT INTO "cryptocurrency_address"("created_at", "updated_at", "deleted_at", "type","cryptocurrency_id", "chain_id") VALUES (DEFAULT, DEFAULT, DEFAULT, '${addr.type}','${cryptocurrency[0].id}', '${addr.chain_id}')`
          )
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cryptocurrency"`)
    await queryRunner.query(`DROP INDEX "public"."UQ_cryptocurrency_address_chain_type_address"`)
    await queryRunner.query(`DROP TABLE "cryptocurrency_address"`)
    await queryRunner.query(`DROP TYPE "public"."cryptocurrency_address_type_enum"`)
  }
}
