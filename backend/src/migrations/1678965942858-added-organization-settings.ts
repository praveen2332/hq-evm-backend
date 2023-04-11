import { MigrationInterface, QueryRunner } from 'typeorm'

const rolePermissions = [
  {
    roleName: 'Owner',
    permissions: [
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' }
    ]
  },
  {
    roleName: 'Admin',
    permissions: [
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' }
    ]
  }
]

export class addedOrganizationSettings1678965942858 implements MigrationInterface {
  name = 'addedOrganizationSettings1678965942858'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "country"
       (
         "id"         BIGSERIAL         NOT NULL,
         "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
         "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
         "deleted_at" TIMESTAMP,
         "public_id"  uuid              NOT NULL DEFAULT uuid_generate_v4(),
         "name"       character varying NOT NULL,
         "iso"        character varying NOT NULL,
         "iso3"       character varying NOT NULL,
         CONSTRAINT "UQ_0d63ebe53f85d21c69cb042332b" UNIQUE ("public_id"),
         CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id")
       )`
    )
    await queryRunner.query(
      `CREATE TABLE "timezone"
       (
         "id"         BIGSERIAL         NOT NULL,
         "created_at" TIMESTAMP         NOT NULL DEFAULT now(),
         "updated_at" TIMESTAMP         NOT NULL DEFAULT now(),
         "deleted_at" TIMESTAMP,
         "public_id"  uuid              NOT NULL DEFAULT uuid_generate_v4(),
         "name"       character varying NOT NULL,
         "abbrev"     character varying NOT NULL,
         "utc_offset" character varying NOT NULL,
         CONSTRAINT "UQ_3b218e7290f3ec4f08827db704b" UNIQUE ("public_id"),
         CONSTRAINT "PK_2706edc3223dd1d219f9f6a11b1" PRIMARY KEY ("id")
       )`
    )
    await queryRunner.query(
      `CREATE TYPE "public"."organization_setting_cost_basis_method_enum" AS ENUM('FIFO', 'LIFO')`
    )
    await queryRunner.query(
      `CREATE TABLE "organization_setting"
       (
         "id"                BIGSERIAL                                              NOT NULL,
         "created_at"        TIMESTAMP                                              NOT NULL DEFAULT now(),
         "updated_at"        TIMESTAMP                                              NOT NULL DEFAULT now(),
         "deleted_at"        TIMESTAMP,
         "public_id"         uuid                                                   NOT NULL DEFAULT uuid_generate_v4(),
         "cost_basis_method" "public"."organization_setting_cost_basis_method_enum" NOT NULL DEFAULT 'FIFO',
         "organization_id"   bigint,
         "country_id"        bigint,
         "timezone_id"       bigint,
         "fiat_currency_id"  bigint,
         CONSTRAINT "UQ_6e19bb98e00c40be14bcb6c801a" UNIQUE ("public_id"),
         CONSTRAINT "PK_c7b40ddf0471fbc7ba6946cd310" PRIMARY KEY ("id")
       )`
    )
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum" RENAME TO "permission_resource_enum_old"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum" AS ENUM('source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets', 'cryptocurrencies', 'settings')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum" USING "resource"::"text"::"public"."permission_resource_enum"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum_old"`)
    await queryRunner.query(
      `ALTER TABLE "organization_setting"
        ADD CONSTRAINT "FK_fa7bab067284c1b63d7e2326b5b" FOREIGN KEY ("organization_id") REFERENCES "organization" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_setting"
        ADD CONSTRAINT "FK_0bbc44e4c14530c4c813abc5f66" FOREIGN KEY ("country_id") REFERENCES "country" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_setting"
        ADD CONSTRAINT "FK_c0b19b6fefdb03eec36a3fca311" FOREIGN KEY ("timezone_id") REFERENCES "timezone" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )
    await queryRunner.query(
      `ALTER TABLE "organization_setting"
        ADD CONSTRAINT "FK_af9c8c180462350bff21cdb563f" FOREIGN KEY ("fiat_currency_id") REFERENCES "fiat_currency" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    )

    for (const rolePermission of rolePermissions) {
      const role = await queryRunner.query(`SELECT id
                                            FROM "role"
                                            WHERE "name" = '${rolePermission.roleName}'`)
      for (const permission of rolePermission.permissions) {
        await queryRunner.query(
          `INSERT INTO "permission"("created_at", "updated_at", "deleted_at", "resource", "action", "role_id")
           VALUES (DEFAULT, DEFAULT, DEFAULT, '${permission.resource}', '${permission.action}', '${role[0].id}')`
        )
      }
    }

    // Populate countries and timezones
    for (const timezone of timezones) {
      await queryRunner.query(
        `INSERT INTO "timezone" (name, abbrev, utc_offset)
         VALUES ('${timezone.value}', '${timezone.abbr}', ${timezone.offset * 60})`
      )
    }

    for (const country of countries) {
      await queryRunner.query(
        `INSERT INTO "country" (name, iso, iso3)
         VALUES ('${country.nicename}', '${country.iso}', '${country.iso3}')`
      )
    }

    // Create organization settings for existing organizations

    //get usd currency
    const usdCurrency = await queryRunner.query(`SELECT id
                                                 FROM "fiat_currency"
                                                 WHERE alphabetic_code = 'USD'`)

    //get GMT timezone
    const gtmTimezone = await queryRunner.query(`SELECT id
                                                 FROM "timezone"
                                                 WHERE abbrev = 'GMT'`)

    //get all organizations
    const organizationIds = await queryRunner.query(`SELECT id
                                                     FROM "organization"`)

    for (const organizationId of organizationIds) {
      await queryRunner.query(
        `INSERT INTO "organization_setting" (organization_id, country_id, timezone_id, fiat_currency_id)
         VALUES (${organizationId.id}, null, ${gtmTimezone[0].id}, ${usdCurrency[0].id})`
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const rolePermission of rolePermissions) {
      const role = await queryRunner.query(`SELECT id
                                            FROM "role"
                                            WHERE "name" = '${rolePermission.roleName}'`)
      for (const permission of rolePermission.permissions) {
        await queryRunner.query(
          `DELETE
           FROM "permission"
           where resource = '${permission.resource}' and action = '${permission.action}' and role_id='${role[0].id}'`
        )
      }
    }

    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "FK_af9c8c180462350bff21cdb563f"`)
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "FK_c0b19b6fefdb03eec36a3fca311"`)
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "FK_0bbc44e4c14530c4c813abc5f66"`)
    await queryRunner.query(`ALTER TABLE "organization_setting" DROP CONSTRAINT "FK_fa7bab067284c1b63d7e2326b5b"`)
    await queryRunner.query(
      `CREATE TYPE "public"."permission_resource_enum_old" AS ENUM('source_of_funds', 'transactions', 'transfers', 'invitations', 'recipients', 'categories', 'members', 'payment_links', 'financial_transactions', 'wallets', 'wallet_groups', 'assets', 'cryptocurrencies')`
    )
    await queryRunner.query(
      `ALTER TABLE "permission" ALTER COLUMN "resource" TYPE "public"."permission_resource_enum_old" USING "resource"::"text"::"public"."permission_resource_enum_old"`
    )
    await queryRunner.query(`DROP TYPE "public"."permission_resource_enum"`)
    await queryRunner.query(`ALTER TYPE "public"."permission_resource_enum_old" RENAME TO "permission_resource_enum"`)
    await queryRunner.query(`DROP TABLE "organization_setting"`)
    await queryRunner.query(`DROP TYPE "public"."organization_setting_cost_basis_method_enum"`)
    await queryRunner.query(`DROP TABLE "timezone"`)
    await queryRunner.query(`DROP TABLE "country"`)
  }
}

const timezones = [
  {
    value: 'Dateline Standard Time',
    abbr: 'DST',
    offset: -12,
    isdst: false,
    text: '(UTC-12:00) International Date Line West',
    utc: ['Etc/GMT+12']
  },
  {
    value: 'UTC-11',
    abbr: 'U',
    offset: -11,
    isdst: false,
    text: '(UTC-11:00) Coordinated Universal Time-11',
    utc: ['Etc/GMT+11', 'Pacific/Midway', 'Pacific/Niue', 'Pacific/Pago_Pago']
  },
  {
    value: 'Hawaiian Standard Time',
    abbr: 'HST',
    offset: -10,
    isdst: false,
    text: '(UTC-10:00) Hawaii',
    utc: ['Etc/GMT+10', 'Pacific/Honolulu', 'Pacific/Johnston', 'Pacific/Rarotonga', 'Pacific/Tahiti']
  },
  {
    value: 'Alaskan Standard Time',
    abbr: 'AKDT',
    offset: -8,
    isdst: true,
    text: '(UTC-09:00) Alaska',
    utc: ['America/Anchorage', 'America/Juneau', 'America/Nome', 'America/Sitka', 'America/Yakutat']
  },
  {
    value: 'Pacific Standard Time (Mexico)',
    abbr: 'PDT',
    offset: -7,
    isdst: true,
    text: '(UTC-08:00) Baja California',
    utc: ['America/Santa_Isabel']
  },
  {
    value: 'Pacific Daylight Time',
    abbr: 'PDT',
    offset: -7,
    isdst: true,
    text: '(UTC-07:00) Pacific Daylight Time (US & Canada)',
    utc: ['America/Los_Angeles', 'America/Tijuana', 'America/Vancouver']
  },
  {
    value: 'Pacific Standard Time',
    abbr: 'PST',
    offset: -8,
    isdst: false,
    text: '(UTC-08:00) Pacific Standard Time (US & Canada)',
    utc: ['America/Los_Angeles', 'America/Tijuana', 'America/Vancouver', 'PST8PDT']
  },
  {
    value: 'US Mountain Standard Time',
    abbr: 'UMST',
    offset: -7,
    isdst: false,
    text: '(UTC-07:00) Arizona',
    utc: [
      'America/Creston',
      'America/Dawson',
      'America/Dawson_Creek',
      'America/Hermosillo',
      'America/Phoenix',
      'America/Whitehorse',
      'Etc/GMT+7'
    ]
  },
  {
    value: 'Mountain Standard Time (Mexico)',
    abbr: 'MDT',
    offset: -6,
    isdst: true,
    text: '(UTC-07:00) Chihuahua, La Paz, Mazatlan',
    utc: ['America/Chihuahua', 'America/Mazatlan']
  },
  {
    value: 'Mountain Standard Time',
    abbr: 'MDT',
    offset: -6,
    isdst: true,
    text: '(UTC-07:00) Mountain Time (US & Canada)',
    utc: [
      'America/Boise',
      'America/Cambridge_Bay',
      'America/Denver',
      'America/Edmonton',
      'America/Inuvik',
      'America/Ojinaga',
      'America/Yellowknife',
      'MST7MDT'
    ]
  },
  {
    value: 'Central America Standard Time',
    abbr: 'CAST',
    offset: -6,
    isdst: false,
    text: '(UTC-06:00) Central America',
    utc: [
      'America/Belize',
      'America/Costa_Rica',
      'America/El_Salvador',
      'America/Guatemala',
      'America/Managua',
      'America/Tegucigalpa',
      'Etc/GMT+6',
      'Pacific/Galapagos'
    ]
  },
  {
    value: 'Central Standard Time',
    abbr: 'CDT',
    offset: -5,
    isdst: true,
    text: '(UTC-06:00) Central Time (US & Canada)',
    utc: [
      'America/Chicago',
      'America/Indiana/Knox',
      'America/Indiana/Tell_City',
      'America/Matamoros',
      'America/Menominee',
      'America/North_Dakota/Beulah',
      'America/North_Dakota/Center',
      'America/North_Dakota/New_Salem',
      'America/Rainy_River',
      'America/Rankin_Inlet',
      'America/Resolute',
      'America/Winnipeg',
      'CST6CDT'
    ]
  },
  {
    value: 'Central Standard Time (Mexico)',
    abbr: 'CDT',
    offset: -5,
    isdst: true,
    text: '(UTC-06:00) Guadalajara, Mexico City, Monterrey',
    utc: ['America/Bahia_Banderas', 'America/Cancun', 'America/Merida', 'America/Mexico_City', 'America/Monterrey']
  },
  {
    value: 'Canada Central Standard Time',
    abbr: 'CCST',
    offset: -6,
    isdst: false,
    text: '(UTC-06:00) Saskatchewan',
    utc: ['America/Regina', 'America/Swift_Current']
  },
  {
    value: 'SA Pacific Standard Time',
    abbr: 'SPST',
    offset: -5,
    isdst: false,
    text: '(UTC-05:00) Bogota, Lima, Quito',
    utc: [
      'America/Bogota',
      'America/Cayman',
      'America/Coral_Harbour',
      'America/Eirunepe',
      'America/Guayaquil',
      'America/Jamaica',
      'America/Lima',
      'America/Panama',
      'America/Rio_Branco',
      'Etc/GMT+5'
    ]
  },
  {
    value: 'Eastern Standard Time',
    abbr: 'EST',
    offset: -5,
    isdst: false,
    text: '(UTC-05:00) Eastern Time (US & Canada)',
    utc: [
      'America/Detroit',
      'America/Havana',
      'America/Indiana/Petersburg',
      'America/Indiana/Vincennes',
      'America/Indiana/Winamac',
      'America/Iqaluit',
      'America/Kentucky/Monticello',
      'America/Louisville',
      'America/Montreal',
      'America/Nassau',
      'America/New_York',
      'America/Nipigon',
      'America/Pangnirtung',
      'America/Port-au-Prince',
      'America/Thunder_Bay',
      'America/Toronto'
    ]
  },
  {
    value: 'Eastern Daylight Time',
    abbr: 'EDT',
    offset: -4,
    isdst: true,
    text: '(UTC-04:00) Eastern Daylight Time (US & Canada)',
    utc: [
      'America/Detroit',
      'America/Havana',
      'America/Indiana/Petersburg',
      'America/Indiana/Vincennes',
      'America/Indiana/Winamac',
      'America/Iqaluit',
      'America/Kentucky/Monticello',
      'America/Louisville',
      'America/Montreal',
      'America/Nassau',
      'America/New_York',
      'America/Nipigon',
      'America/Pangnirtung',
      'America/Port-au-Prince',
      'America/Thunder_Bay',
      'America/Toronto'
    ]
  },
  {
    value: 'US Eastern Standard Time',
    abbr: 'UEDT',
    offset: -5,
    isdst: false,
    text: '(UTC-05:00) Indiana (East)',
    utc: ['America/Indiana/Marengo', 'America/Indiana/Vevay', 'America/Indianapolis']
  },
  {
    value: 'Venezuela Standard Time',
    abbr: 'VST',
    offset: -4.5,
    isdst: false,
    text: '(UTC-04:30) Caracas',
    utc: ['America/Caracas']
  },
  {
    value: 'Paraguay Standard Time',
    abbr: 'PYT',
    offset: -4,
    isdst: false,
    text: '(UTC-04:00) Asuncion',
    utc: ['America/Asuncion']
  },
  {
    value: 'Atlantic Standard Time',
    abbr: 'ADT',
    offset: -3,
    isdst: true,
    text: '(UTC-04:00) Atlantic Time (Canada)',
    utc: [
      'America/Glace_Bay',
      'America/Goose_Bay',
      'America/Halifax',
      'America/Moncton',
      'America/Thule',
      'Atlantic/Bermuda'
    ]
  },
  {
    value: 'Central Brazilian Standard Time',
    abbr: 'CBST',
    offset: -4,
    isdst: false,
    text: '(UTC-04:00) Cuiaba',
    utc: ['America/Campo_Grande', 'America/Cuiaba']
  },
  {
    value: 'SA Western Standard Time',
    abbr: 'SWST',
    offset: -4,
    isdst: false,
    text: '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan',
    utc: [
      'America/Anguilla',
      'America/Antigua',
      'America/Aruba',
      'America/Barbados',
      'America/Blanc-Sablon',
      'America/Boa_Vista',
      'America/Curacao',
      'America/Dominica',
      'America/Grand_Turk',
      'America/Grenada',
      'America/Guadeloupe',
      'America/Guyana',
      'America/Kralendijk',
      'America/La_Paz',
      'America/Lower_Princes',
      'America/Manaus',
      'America/Marigot',
      'America/Martinique',
      'America/Montserrat',
      'America/Port_of_Spain',
      'America/Porto_Velho',
      'America/Puerto_Rico',
      'America/Santo_Domingo',
      'America/St_Barthelemy',
      'America/St_Kitts',
      'America/St_Lucia',
      'America/St_Thomas',
      'America/St_Vincent',
      'America/Tortola',
      'Etc/GMT+4'
    ]
  },
  {
    value: 'Pacific SA Standard Time',
    abbr: 'PSST',
    offset: -4,
    isdst: false,
    text: '(UTC-04:00) Santiago',
    utc: ['America/Santiago', 'Antarctica/Palmer']
  },
  {
    value: 'Newfoundland Standard Time',
    abbr: 'NDT',
    offset: -2.5,
    isdst: true,
    text: '(UTC-03:30) Newfoundland',
    utc: ['America/St_Johns']
  },
  {
    value: 'E. South America Standard Time',
    abbr: 'ESAST',
    offset: -3,
    isdst: false,
    text: '(UTC-03:00) Brasilia',
    utc: ['America/Sao_Paulo']
  },
  {
    value: 'Argentina Standard Time',
    abbr: 'AST',
    offset: -3,
    isdst: false,
    text: '(UTC-03:00) Buenos Aires',
    utc: [
      'America/Argentina/Buenos_Aires',
      'America/Argentina/Catamarca',
      'America/Argentina/Cordoba',
      'America/Argentina/Jujuy',
      'America/Argentina/La_Rioja',
      'America/Argentina/Mendoza',
      'America/Argentina/Rio_Gallegos',
      'America/Argentina/Salta',
      'America/Argentina/San_Juan',
      'America/Argentina/San_Luis',
      'America/Argentina/Tucuman',
      'America/Argentina/Ushuaia',
      'America/Buenos_Aires',
      'America/Catamarca',
      'America/Cordoba',
      'America/Jujuy',
      'America/Mendoza'
    ]
  },
  {
    value: 'SA Eastern Standard Time',
    abbr: 'SEST',
    offset: -3,
    isdst: false,
    text: '(UTC-03:00) Cayenne, Fortaleza',
    utc: [
      'America/Araguaina',
      'America/Belem',
      'America/Cayenne',
      'America/Fortaleza',
      'America/Maceio',
      'America/Paramaribo',
      'America/Recife',
      'America/Santarem',
      'Antarctica/Rothera',
      'Atlantic/Stanley',
      'Etc/GMT+3'
    ]
  },
  {
    value: 'Greenland Standard Time',
    abbr: 'GDT',
    offset: -3,
    isdst: true,
    text: '(UTC-03:00) Greenland',
    utc: ['America/Godthab']
  },
  {
    value: 'Montevideo Standard Time',
    abbr: 'MST',
    offset: -3,
    isdst: false,
    text: '(UTC-03:00) Montevideo',
    utc: ['America/Montevideo']
  },
  {
    value: 'Bahia Standard Time',
    abbr: 'BST',
    offset: -3,
    isdst: false,
    text: '(UTC-03:00) Salvador',
    utc: ['America/Bahia']
  },
  {
    value: 'UTC-02',
    abbr: 'U',
    offset: -2,
    isdst: false,
    text: '(UTC-02:00) Coordinated Universal Time-02',
    utc: ['America/Noronha', 'Atlantic/South_Georgia', 'Etc/GMT+2']
  },
  {
    value: 'Mid-Atlantic Standard Time',
    abbr: 'MDT',
    offset: -1,
    isdst: true,
    text: '(UTC-02:00) Mid-Atlantic - Old',
    utc: []
  },
  {
    value: 'Azores Standard Time',
    abbr: 'ADT',
    offset: 0,
    isdst: true,
    text: '(UTC-01:00) Azores',
    utc: ['America/Scoresbysund', 'Atlantic/Azores']
  },
  {
    value: 'Cape Verde Standard Time',
    abbr: 'CVST',
    offset: -1,
    isdst: false,
    text: '(UTC-01:00) Cape Verde Is.',
    utc: ['Atlantic/Cape_Verde', 'Etc/GMT+1']
  },
  {
    value: 'Morocco Standard Time',
    abbr: 'MDT',
    offset: 1,
    isdst: true,
    text: '(UTC) Casablanca',
    utc: ['Africa/Casablanca', 'Africa/El_Aaiun']
  },
  {
    value: 'UTC',
    abbr: 'UTC',
    offset: 0,
    isdst: false,
    text: '(UTC) Coordinated Universal Time',
    utc: ['America/Danmarkshavn', 'Etc/GMT']
  },
  {
    value: 'GMT Standard Time',
    abbr: 'GMT',
    offset: 0,
    isdst: false,
    text: '(UTC) Edinburgh, London',
    utc: ['Europe/Isle_of_Man', 'Europe/Guernsey', 'Europe/Jersey', 'Europe/London']
  },
  {
    value: 'British Summer Time',
    abbr: 'BST',
    offset: 1,
    isdst: true,
    text: '(UTC+01:00) Edinburgh, London',
    utc: ['Europe/Isle_of_Man', 'Europe/Guernsey', 'Europe/Jersey', 'Europe/London']
  },
  {
    value: 'GMT Standard Time',
    abbr: 'GDT',
    offset: 1,
    isdst: true,
    text: '(UTC) Dublin, Lisbon',
    utc: ['Atlantic/Canary', 'Atlantic/Faeroe', 'Atlantic/Madeira', 'Europe/Dublin', 'Europe/Lisbon']
  },
  {
    value: 'Greenwich Standard Time',
    abbr: 'GST',
    offset: 0,
    isdst: false,
    text: '(UTC) Monrovia, Reykjavik',
    utc: [
      'Africa/Abidjan',
      'Africa/Accra',
      'Africa/Bamako',
      'Africa/Banjul',
      'Africa/Bissau',
      'Africa/Conakry',
      'Africa/Dakar',
      'Africa/Freetown',
      'Africa/Lome',
      'Africa/Monrovia',
      'Africa/Nouakchott',
      'Africa/Ouagadougou',
      'Africa/Sao_Tome',
      'Atlantic/Reykjavik',
      'Atlantic/St_Helena'
    ]
  },
  {
    value: 'W. Europe Standard Time',
    abbr: 'WEDT',
    offset: 2,
    isdst: true,
    text: '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
    utc: [
      'Arctic/Longyearbyen',
      'Europe/Amsterdam',
      'Europe/Andorra',
      'Europe/Berlin',
      'Europe/Busingen',
      'Europe/Gibraltar',
      'Europe/Luxembourg',
      'Europe/Malta',
      'Europe/Monaco',
      'Europe/Oslo',
      'Europe/Rome',
      'Europe/San_Marino',
      'Europe/Stockholm',
      'Europe/Vaduz',
      'Europe/Vatican',
      'Europe/Vienna',
      'Europe/Zurich'
    ]
  },
  {
    value: 'Central Europe Standard Time',
    abbr: 'CEDT',
    offset: 2,
    isdst: true,
    text: '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
    utc: [
      'Europe/Belgrade',
      'Europe/Bratislava',
      'Europe/Budapest',
      'Europe/Ljubljana',
      'Europe/Podgorica',
      'Europe/Prague',
      'Europe/Tirane'
    ]
  },
  {
    value: 'Romance Standard Time',
    abbr: 'RDT',
    offset: 2,
    isdst: true,
    text: '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
    utc: ['Africa/Ceuta', 'Europe/Brussels', 'Europe/Copenhagen', 'Europe/Madrid', 'Europe/Paris']
  },
  {
    value: 'Central European Standard Time',
    abbr: 'CEDT',
    offset: 2,
    isdst: true,
    text: '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb',
    utc: ['Europe/Sarajevo', 'Europe/Skopje', 'Europe/Warsaw', 'Europe/Zagreb']
  },
  {
    value: 'W. Central Africa Standard Time',
    abbr: 'WCAST',
    offset: 1,
    isdst: false,
    text: '(UTC+01:00) West Central Africa',
    utc: [
      'Africa/Algiers',
      'Africa/Bangui',
      'Africa/Brazzaville',
      'Africa/Douala',
      'Africa/Kinshasa',
      'Africa/Lagos',
      'Africa/Libreville',
      'Africa/Luanda',
      'Africa/Malabo',
      'Africa/Ndjamena',
      'Africa/Niamey',
      'Africa/Porto-Novo',
      'Africa/Tunis',
      'Etc/GMT-1'
    ]
  },
  {
    value: 'Namibia Standard Time',
    abbr: 'NST',
    offset: 1,
    isdst: false,
    text: '(UTC+01:00) Windhoek',
    utc: ['Africa/Windhoek']
  },
  {
    value: 'GTB Standard Time',
    abbr: 'GDT',
    offset: 3,
    isdst: true,
    text: '(UTC+02:00) Athens, Bucharest',
    utc: ['Asia/Nicosia', 'Europe/Athens', 'Europe/Bucharest', 'Europe/Chisinau']
  },
  {
    value: 'Middle East Standard Time',
    abbr: 'MEDT',
    offset: 3,
    isdst: true,
    text: '(UTC+02:00) Beirut',
    utc: ['Asia/Beirut']
  },
  {
    value: 'Egypt Standard Time',
    abbr: 'EST',
    offset: 2,
    isdst: false,
    text: '(UTC+02:00) Cairo',
    utc: ['Africa/Cairo']
  },
  {
    value: 'Syria Standard Time',
    abbr: 'SDT',
    offset: 3,
    isdst: true,
    text: '(UTC+02:00) Damascus',
    utc: ['Asia/Damascus']
  },
  {
    value: 'E. Europe Standard Time',
    abbr: 'EEDT',
    offset: 3,
    isdst: true,
    text: '(UTC+02:00) E. Europe',
    utc: [
      'Asia/Nicosia',
      'Europe/Athens',
      'Europe/Bucharest',
      'Europe/Chisinau',
      'Europe/Helsinki',
      'Europe/Kiev',
      'Europe/Mariehamn',
      'Europe/Nicosia',
      'Europe/Riga',
      'Europe/Sofia',
      'Europe/Tallinn',
      'Europe/Uzhgorod',
      'Europe/Vilnius',
      'Europe/Zaporozhye'
    ]
  },
  {
    value: 'South Africa Standard Time',
    abbr: 'SAST',
    offset: 2,
    isdst: false,
    text: '(UTC+02:00) Harare, Pretoria',
    utc: [
      'Africa/Blantyre',
      'Africa/Bujumbura',
      'Africa/Gaborone',
      'Africa/Harare',
      'Africa/Johannesburg',
      'Africa/Kigali',
      'Africa/Lubumbashi',
      'Africa/Lusaka',
      'Africa/Maputo',
      'Africa/Maseru',
      'Africa/Mbabane',
      'Etc/GMT-2'
    ]
  },
  {
    value: 'FLE Standard Time',
    abbr: 'FDT',
    offset: 3,
    isdst: true,
    text: '(UTC+02:00) Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius',
    utc: [
      'Europe/Helsinki',
      'Europe/Kiev',
      'Europe/Mariehamn',
      'Europe/Riga',
      'Europe/Sofia',
      'Europe/Tallinn',
      'Europe/Uzhgorod',
      'Europe/Vilnius',
      'Europe/Zaporozhye'
    ]
  },
  {
    value: 'Turkey Standard Time',
    abbr: 'TDT',
    offset: 3,
    isdst: false,
    text: '(UTC+03:00) Istanbul',
    utc: ['Europe/Istanbul']
  },
  {
    value: 'Israel Standard Time',
    abbr: 'JDT',
    offset: 3,
    isdst: true,
    text: '(UTC+02:00) Jerusalem',
    utc: ['Asia/Jerusalem']
  },
  {
    value: 'Libya Standard Time',
    abbr: 'LST',
    offset: 2,
    isdst: false,
    text: '(UTC+02:00) Tripoli',
    utc: ['Africa/Tripoli']
  },
  {
    value: 'Jordan Standard Time',
    abbr: 'JST',
    offset: 3,
    isdst: false,
    text: '(UTC+03:00) Amman',
    utc: ['Asia/Amman']
  },
  {
    value: 'Arabic Standard Time',
    abbr: 'AST',
    offset: 3,
    isdst: false,
    text: '(UTC+03:00) Baghdad',
    utc: ['Asia/Baghdad']
  },
  {
    value: 'Kaliningrad Standard Time',
    abbr: 'KST',
    offset: 3,
    isdst: false,
    text: '(UTC+02:00) Kaliningrad',
    utc: ['Europe/Kaliningrad']
  },
  {
    value: 'Arab Standard Time',
    abbr: 'AST',
    offset: 3,
    isdst: false,
    text: '(UTC+03:00) Kuwait, Riyadh',
    utc: ['Asia/Aden', 'Asia/Bahrain', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Riyadh']
  },
  {
    value: 'E. Africa Standard Time',
    abbr: 'EAST',
    offset: 3,
    isdst: false,
    text: '(UTC+03:00) Nairobi',
    utc: [
      'Africa/Addis_Ababa',
      'Africa/Asmera',
      'Africa/Dar_es_Salaam',
      'Africa/Djibouti',
      'Africa/Juba',
      'Africa/Kampala',
      'Africa/Khartoum',
      'Africa/Mogadishu',
      'Africa/Nairobi',
      'Antarctica/Syowa',
      'Etc/GMT-3',
      'Indian/Antananarivo',
      'Indian/Comoro',
      'Indian/Mayotte'
    ]
  },
  {
    value: 'Moscow Standard Time',
    abbr: 'MSK',
    offset: 3,
    isdst: false,
    text: '(UTC+03:00) Moscow, St. Petersburg, Volgograd, Minsk',
    utc: ['Europe/Kirov', 'Europe/Moscow', 'Europe/Simferopol', 'Europe/Volgograd', 'Europe/Minsk']
  },
  {
    value: 'Samara Time',
    abbr: 'SAMT',
    offset: 4,
    isdst: false,
    text: '(UTC+04:00) Samara, Ulyanovsk, Saratov',
    utc: ['Europe/Astrakhan', 'Europe/Samara', 'Europe/Ulyanovsk']
  },
  {
    value: 'Iran Standard Time',
    abbr: 'IDT',
    offset: 4.5,
    isdst: true,
    text: '(UTC+03:30) Tehran',
    utc: ['Asia/Tehran']
  },
  {
    value: 'Arabian Standard Time',
    abbr: 'AST',
    offset: 4,
    isdst: false,
    text: '(UTC+04:00) Abu Dhabi, Muscat',
    utc: ['Asia/Dubai', 'Asia/Muscat', 'Etc/GMT-4']
  },
  {
    value: 'Azerbaijan Standard Time',
    abbr: 'ADT',
    offset: 5,
    isdst: true,
    text: '(UTC+04:00) Baku',
    utc: ['Asia/Baku']
  },
  {
    value: 'Mauritius Standard Time',
    abbr: 'MST',
    offset: 4,
    isdst: false,
    text: '(UTC+04:00) Port Louis',
    utc: ['Indian/Mahe', 'Indian/Mauritius', 'Indian/Reunion']
  },
  {
    value: 'Georgian Standard Time',
    abbr: 'GET',
    offset: 4,
    isdst: false,
    text: '(UTC+04:00) Tbilisi',
    utc: ['Asia/Tbilisi']
  },
  {
    value: 'Caucasus Standard Time',
    abbr: 'CST',
    offset: 4,
    isdst: false,
    text: '(UTC+04:00) Yerevan',
    utc: ['Asia/Yerevan']
  },
  {
    value: 'Afghanistan Standard Time',
    abbr: 'AST',
    offset: 4.5,
    isdst: false,
    text: '(UTC+04:30) Kabul',
    utc: ['Asia/Kabul']
  },
  {
    value: 'West Asia Standard Time',
    abbr: 'WAST',
    offset: 5,
    isdst: false,
    text: '(UTC+05:00) Ashgabat, Tashkent',
    utc: [
      'Antarctica/Mawson',
      'Asia/Aqtau',
      'Asia/Aqtobe',
      'Asia/Ashgabat',
      'Asia/Dushanbe',
      'Asia/Oral',
      'Asia/Samarkand',
      'Asia/Tashkent',
      'Etc/GMT-5',
      'Indian/Kerguelen',
      'Indian/Maldives'
    ]
  },
  {
    value: 'Yekaterinburg Time',
    abbr: 'YEKT',
    offset: 5,
    isdst: false,
    text: '(UTC+05:00) Yekaterinburg',
    utc: ['Asia/Yekaterinburg']
  },
  {
    value: 'Pakistan Standard Time',
    abbr: 'PKT',
    offset: 5,
    isdst: false,
    text: '(UTC+05:00) Islamabad, Karachi',
    utc: ['Asia/Karachi']
  },
  {
    value: 'India Standard Time',
    abbr: 'IST',
    offset: 5.5,
    isdst: false,
    text: '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    utc: ['Asia/Kolkata', 'Asia/Calcutta']
  },
  {
    value: 'Sri Lanka Standard Time',
    abbr: 'SLST',
    offset: 5.5,
    isdst: false,
    text: '(UTC+05:30) Sri Jayawardenepura',
    utc: ['Asia/Colombo']
  },
  {
    value: 'Nepal Standard Time',
    abbr: 'NST',
    offset: 5.75,
    isdst: false,
    text: '(UTC+05:45) Kathmandu',
    utc: ['Asia/Kathmandu']
  },
  {
    value: 'Central Asia Standard Time',
    abbr: 'CAST',
    offset: 6,
    isdst: false,
    text: '(UTC+06:00) Nur-Sultan (Astana)',
    utc: [
      'Antarctica/Vostok',
      'Asia/Almaty',
      'Asia/Bishkek',
      'Asia/Qyzylorda',
      'Asia/Urumqi',
      'Etc/GMT-6',
      'Indian/Chagos'
    ]
  },
  {
    value: 'Bangladesh Standard Time',
    abbr: 'BST',
    offset: 6,
    isdst: false,
    text: '(UTC+06:00) Dhaka',
    utc: ['Asia/Dhaka', 'Asia/Thimphu']
  },
  {
    value: 'Myanmar Standard Time',
    abbr: 'MST',
    offset: 6.5,
    isdst: false,
    text: '(UTC+06:30) Yangon (Rangoon)',
    utc: ['Asia/Rangoon', 'Indian/Cocos']
  },
  {
    value: 'SE Asia Standard Time',
    abbr: 'SAST',
    offset: 7,
    isdst: false,
    text: '(UTC+07:00) Bangkok, Hanoi, Jakarta',
    utc: [
      'Antarctica/Davis',
      'Asia/Bangkok',
      'Asia/Hovd',
      'Asia/Jakarta',
      'Asia/Phnom_Penh',
      'Asia/Pontianak',
      'Asia/Saigon',
      'Asia/Vientiane',
      'Etc/GMT-7',
      'Indian/Christmas'
    ]
  },
  {
    value: 'N. Central Asia Standard Time',
    abbr: 'NCAST',
    offset: 7,
    isdst: false,
    text: '(UTC+07:00) Novosibirsk',
    utc: ['Asia/Novokuznetsk', 'Asia/Novosibirsk', 'Asia/Omsk']
  },
  {
    value: 'China Standard Time',
    abbr: 'CST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi',
    utc: ['Asia/Hong_Kong', 'Asia/Macau', 'Asia/Shanghai']
  },
  {
    value: 'North Asia Standard Time',
    abbr: 'NAST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Krasnoyarsk',
    utc: ['Asia/Krasnoyarsk']
  },
  {
    value: 'Singapore Standard Time',
    abbr: 'MPST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Kuala Lumpur, Singapore',
    utc: [
      'Asia/Brunei',
      'Asia/Kuala_Lumpur',
      'Asia/Kuching',
      'Asia/Makassar',
      'Asia/Manila',
      'Asia/Singapore',
      'Etc/GMT-8'
    ]
  },
  {
    value: 'W. Australia Standard Time',
    abbr: 'WAST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Perth',
    utc: ['Antarctica/Casey', 'Australia/Perth']
  },
  {
    value: 'Taipei Standard Time',
    abbr: 'TST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Taipei',
    utc: ['Asia/Taipei']
  },
  {
    value: 'Ulaanbaatar Standard Time',
    abbr: 'UST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Ulaanbaatar',
    utc: ['Asia/Choibalsan', 'Asia/Ulaanbaatar']
  },
  {
    value: 'North Asia East Standard Time',
    abbr: 'NAEST',
    offset: 8,
    isdst: false,
    text: '(UTC+08:00) Irkutsk',
    utc: ['Asia/Irkutsk']
  },
  {
    value: 'Japan Standard Time',
    abbr: 'JST',
    offset: 9,
    isdst: false,
    text: '(UTC+09:00) Osaka, Sapporo, Tokyo',
    utc: ['Asia/Dili', 'Asia/Jayapura', 'Asia/Tokyo', 'Etc/GMT-9', 'Pacific/Palau']
  },
  {
    value: 'Korea Standard Time',
    abbr: 'KST',
    offset: 9,
    isdst: false,
    text: '(UTC+09:00) Seoul',
    utc: ['Asia/Pyongyang', 'Asia/Seoul']
  },
  {
    value: 'Cen. Australia Standard Time',
    abbr: 'CAST',
    offset: 9.5,
    isdst: false,
    text: '(UTC+09:30) Adelaide',
    utc: ['Australia/Adelaide', 'Australia/Broken_Hill']
  },
  {
    value: 'AUS Central Standard Time',
    abbr: 'ACST',
    offset: 9.5,
    isdst: false,
    text: '(UTC+09:30) Darwin',
    utc: ['Australia/Darwin']
  },
  {
    value: 'E. Australia Standard Time',
    abbr: 'EAST',
    offset: 10,
    isdst: false,
    text: '(UTC+10:00) Brisbane',
    utc: ['Australia/Brisbane', 'Australia/Lindeman']
  },
  {
    value: 'AUS Eastern Standard Time',
    abbr: 'AEST',
    offset: 10,
    isdst: false,
    text: '(UTC+10:00) Canberra, Melbourne, Sydney',
    utc: ['Australia/Melbourne', 'Australia/Sydney']
  },
  {
    value: 'West Pacific Standard Time',
    abbr: 'WPST',
    offset: 10,
    isdst: false,
    text: '(UTC+10:00) Guam, Port Moresby',
    utc: [
      'Antarctica/DumontDUrville',
      'Etc/GMT-10',
      'Pacific/Guam',
      'Pacific/Port_Moresby',
      'Pacific/Saipan',
      'Pacific/Truk'
    ]
  },
  {
    value: 'Tasmania Standard Time',
    abbr: 'TST',
    offset: 10,
    isdst: false,
    text: '(UTC+10:00) Hobart',
    utc: ['Australia/Currie', 'Australia/Hobart']
  },
  {
    value: 'Yakutsk Standard Time',
    abbr: 'YST',
    offset: 9,
    isdst: false,
    text: '(UTC+09:00) Yakutsk',
    utc: ['Asia/Chita', 'Asia/Khandyga', 'Asia/Yakutsk']
  },
  {
    value: 'Central Pacific Standard Time',
    abbr: 'CPST',
    offset: 11,
    isdst: false,
    text: '(UTC+11:00) Solomon Is., New Caledonia',
    utc: [
      'Antarctica/Macquarie',
      'Etc/GMT-11',
      'Pacific/Efate',
      'Pacific/Guadalcanal',
      'Pacific/Kosrae',
      'Pacific/Noumea',
      'Pacific/Ponape'
    ]
  },
  {
    value: 'Vladivostok Standard Time',
    abbr: 'VST',
    offset: 11,
    isdst: false,
    text: '(UTC+11:00) Vladivostok',
    utc: ['Asia/Sakhalin', 'Asia/Ust-Nera', 'Asia/Vladivostok']
  },
  {
    value: 'New Zealand Standard Time',
    abbr: 'NZST',
    offset: 12,
    isdst: false,
    text: '(UTC+12:00) Auckland, Wellington',
    utc: ['Antarctica/McMurdo', 'Pacific/Auckland']
  },
  {
    value: 'UTC+12',
    abbr: 'U',
    offset: 12,
    isdst: false,
    text: '(UTC+12:00) Coordinated Universal Time+12',
    utc: [
      'Etc/GMT-12',
      'Pacific/Funafuti',
      'Pacific/Kwajalein',
      'Pacific/Majuro',
      'Pacific/Nauru',
      'Pacific/Tarawa',
      'Pacific/Wake',
      'Pacific/Wallis'
    ]
  },
  {
    value: 'Fiji Standard Time',
    abbr: 'FST',
    offset: 12,
    isdst: false,
    text: '(UTC+12:00) Fiji',
    utc: ['Pacific/Fiji']
  },
  {
    value: 'Magadan Standard Time',
    abbr: 'MST',
    offset: 12,
    isdst: false,
    text: '(UTC+12:00) Magadan',
    utc: ['Asia/Anadyr', 'Asia/Kamchatka', 'Asia/Magadan', 'Asia/Srednekolymsk']
  },
  {
    value: 'Kamchatka Standard Time',
    abbr: 'KDT',
    offset: 13,
    isdst: true,
    text: '(UTC+12:00) Petropavlovsk-Kamchatsky - Old',
    utc: ['Asia/Kamchatka']
  },
  {
    value: 'Tonga Standard Time',
    abbr: 'TST',
    offset: 13,
    isdst: false,
    text: "(UTC+13:00) Nuku'alofa",
    utc: ['Etc/GMT-13', 'Pacific/Enderbury', 'Pacific/Fakaofo', 'Pacific/Tongatapu']
  },
  {
    value: 'Samoa Standard Time',
    abbr: 'SST',
    offset: 13,
    isdst: false,
    text: '(UTC+13:00) Samoa',
    utc: ['Pacific/Apia']
  }
]

const countries = [
  { iso: 'AF', name: 'AFGHANISTAN', nicename: 'Afghanistan', iso3: 'AFG' },
  { iso: 'AL', name: 'ALBANIA', nicename: 'Albania', iso3: 'ALB' },
  { iso: 'DZ', name: 'ALGERIA', nicename: 'Algeria', iso3: 'DZA' },
  { iso: 'AS', name: 'AMERICAN SAMOA', nicename: 'American Samoa', iso3: 'ASM' },
  { iso: 'AD', name: 'ANDORRA', nicename: 'Andorra', iso3: 'AND' },
  { iso: 'AO', name: 'ANGOLA', nicename: 'Angola', iso3: 'AGO' },
  { iso: 'AI', name: 'ANGUILLA', nicename: 'Anguilla', iso3: 'AIA' },
  { iso: 'AQ', name: 'ANTARCTICA', nicename: 'Antarctica', iso3: null },
  { iso: 'AG', name: 'ANTIGUA AND BARBUDA', nicename: 'Antigua and Barbuda', iso3: 'ATG' },
  { iso: 'AR', name: 'ARGENTINA', nicename: 'Argentina', iso3: 'ARG' },
  { iso: 'AM', name: 'ARMENIA', nicename: 'Armenia', iso3: 'ARM' },
  { iso: 'AW', name: 'ARUBA', nicename: 'Aruba', iso3: 'ABW' },
  { iso: 'AU', name: 'AUSTRALIA', nicename: 'Australia', iso3: 'AUS' },
  { iso: 'AT', name: 'AUSTRIA', nicename: 'Austria', iso3: 'AUT' },
  { iso: 'AZ', name: 'AZERBAIJAN', nicename: 'Azerbaijan', iso3: 'AZE' },
  { iso: 'BS', name: 'BAHAMAS', nicename: 'Bahamas', iso3: 'BHS' },
  { iso: 'BH', name: 'BAHRAIN', nicename: 'Bahrain', iso3: 'BHR' },
  { iso: 'BD', name: 'BANGLADESH', nicename: 'Bangladesh', iso3: 'BGD' },
  { iso: 'BB', name: 'BARBADOS', nicename: 'Barbados', iso3: 'BRB' },
  { iso: 'BY', name: 'BELARUS', nicename: 'Belarus', iso3: 'BLR' },
  { iso: 'BE', name: 'BELGIUM', nicename: 'Belgium', iso3: 'BEL' },
  { iso: 'BZ', name: 'BELIZE', nicename: 'Belize', iso3: 'BLZ' },
  { iso: 'BJ', name: 'BENIN', nicename: 'Benin', iso3: 'BEN' },
  { iso: 'BM', name: 'BERMUDA', nicename: 'Bermuda', iso3: 'BMU' },
  { iso: 'BT', name: 'BHUTAN', nicename: 'Bhutan', iso3: 'BTN' },
  { iso: 'BO', name: 'BOLIVIA', nicename: 'Bolivia', iso3: 'BOL' },
  { iso: 'BA', name: 'BOSNIA AND HERZEGOVINA', nicename: 'Bosnia and Herzegovina', iso3: 'BIH' },
  { iso: 'BW', name: 'BOTSWANA', nicename: 'Botswana', iso3: 'BWA' },
  { iso: 'BV', name: 'BOUVET ISLAND', nicename: 'Bouvet Island', iso3: null },
  { iso: 'BR', name: 'BRAZIL', nicename: 'Brazil', iso3: 'BRA' },
  {
    iso: 'IO',
    name: 'BRITISH INDIAN OCEAN TERRITORY',
    nicename: 'British Indian Ocean Territory',
    iso3: null
  },
  { iso: 'BN', name: 'BRUNEI DARUSSALAM', nicename: 'Brunei Darussalam', iso3: 'BRN' },
  { iso: 'BG', name: 'BULGARIA', nicename: 'Bulgaria', iso3: 'BGR' },
  { iso: 'BF', name: 'BURKINA FASO', nicename: 'Burkina Faso', iso3: 'BFA' },
  { iso: 'BI', name: 'BURUNDI', nicename: 'Burundi', iso3: 'BDI' },
  { iso: 'KH', name: 'CAMBODIA', nicename: 'Cambodia', iso3: 'KHM' },
  { iso: 'CM', name: 'CAMEROON', nicename: 'Cameroon', iso3: 'CMR' },
  { iso: 'CA', name: 'CANADA', nicename: 'Canada', iso3: 'CAN' },
  { iso: 'CV', name: 'CAPE VERDE', nicename: 'Cape Verde', iso3: 'CPV' },
  { iso: 'KY', name: 'CAYMAN ISLANDS', nicename: 'Cayman Islands', iso3: 'CYM' },
  { iso: 'CF', name: 'CENTRAL AFRICAN REPUBLIC', nicename: 'Central African Republic', iso3: 'CAF' },
  { iso: 'TD', name: 'CHAD', nicename: 'Chad', iso3: 'TCD' },
  { iso: 'CL', name: 'CHILE', nicename: 'Chile', iso3: 'CHL' },
  { iso: 'CN', name: 'CHINA', nicename: 'China', iso3: 'CHN' },
  { iso: 'CX', name: 'CHRISTMAS ISLAND', nicename: 'Christmas Island', iso3: null },
  { iso: 'CC', name: 'COCOS (KEELING) ISLANDS', nicename: 'Cocos (Keeling) Islands', iso3: null },
  { iso: 'CO', name: 'COLOMBIA', nicename: 'Colombia', iso3: 'COL' },
  { iso: 'KM', name: 'COMOROS', nicename: 'Comoros', iso3: 'COM' },
  { iso: 'CG', name: 'CONGO', nicename: 'Congo', iso3: 'COG' },
  {
    iso: 'CD',
    name: 'CONGO, THE DEMOCRATIC REPUBLIC OF THE',
    nicename: 'Congo, the Democratic Republic of the',
    iso3: 'COD'
  },
  { iso: 'CK', name: 'COOK ISLANDS', nicename: 'Cook Islands', iso3: 'COK' },
  { iso: 'CR', name: 'COSTA RICA', nicename: 'Costa Rica', iso3: 'CRI' },
  { iso: 'CI', name: "COTE D'IVOIRE", nicename: 'Cote D Ivoire', iso3: 'CIV' },
  { iso: 'HR', name: 'CROATIA', nicename: 'Croatia', iso3: 'HRV' },
  { iso: 'CU', name: 'CUBA', nicename: 'Cuba', iso3: 'CUB' },
  { iso: 'CY', name: 'CYPRUS', nicename: 'Cyprus', iso3: 'CYP' },
  { iso: 'CZ', name: 'CZECH REPUBLIC', nicename: 'Czech Republic', iso3: 'CZE' },
  { iso: 'DK', name: 'DENMARK', nicename: 'Denmark', iso3: 'DNK' },
  { iso: 'DJ', name: 'DJIBOUTI', nicename: 'Djibouti', iso3: 'DJI' },
  { iso: 'DM', name: 'DOMINICA', nicename: 'Dominica', iso3: 'DMA' },
  { iso: 'DO', name: 'DOMINICAN REPUBLIC', nicename: 'Dominican Republic', iso3: 'DOM' },
  { iso: 'EC', name: 'ECUADOR', nicename: 'Ecuador', iso3: 'ECU' },
  { iso: 'EG', name: 'EGYPT', nicename: 'Egypt', iso3: 'EGY' },
  { iso: 'SV', name: 'EL SALVADOR', nicename: 'El Salvador', iso3: 'SLV' },
  { iso: 'GQ', name: 'EQUATORIAL GUINEA', nicename: 'Equatorial Guinea', iso3: 'GNQ' },
  { iso: 'ER', name: 'ERITREA', nicename: 'Eritrea', iso3: 'ERI' },
  { iso: 'EE', name: 'ESTONIA', nicename: 'Estonia', iso3: 'EST' },
  { iso: 'ET', name: 'ETHIOPIA', nicename: 'Ethiopia', iso3: 'ETH' },
  {
    iso: 'FK',
    name: 'FALKLAND ISLANDS (MALVINAS)',
    nicename: 'Falkland Islands (Malvinas)',
    iso3: 'FLK'
  },
  { iso: 'FO', name: 'FAROE ISLANDS', nicename: 'Faroe Islands', iso3: 'FRO' },
  { iso: 'FJ', name: 'FIJI', nicename: 'Fiji', iso3: 'FJI' },
  { iso: 'FI', name: 'FINLAND', nicename: 'Finland', iso3: 'FIN' },
  { iso: 'FR', name: 'FRANCE', nicename: 'France', iso3: 'FRA' },
  { iso: 'GF', name: 'FRENCH GUIANA', nicename: 'French Guiana', iso3: 'GUF' },
  { iso: 'PF', name: 'FRENCH POLYNESIA', nicename: 'French Polynesia', iso3: 'PYF' },
  { iso: 'TF', name: 'FRENCH SOUTHERN TERRITORIES', nicename: 'French Southern Territories', iso3: null },
  { iso: 'GA', name: 'GABON', nicename: 'Gabon', iso3: 'GAB' },
  { iso: 'GM', name: 'GAMBIA', nicename: 'Gambia', iso3: 'GMB' },
  { iso: 'GE', name: 'GEORGIA', nicename: 'Georgia', iso3: 'GEO' },
  { iso: 'DE', name: 'GERMANY', nicename: 'Germany', iso3: 'DEU' },
  { iso: 'GH', name: 'GHANA', nicename: 'Ghana', iso3: 'GHA' },
  { iso: 'GI', name: 'GIBRALTAR', nicename: 'Gibraltar', iso3: 'GIB' },
  { iso: 'GR', name: 'GREECE', nicename: 'Greece', iso3: 'GRC' },
  { iso: 'GL', name: 'GREENLAND', nicename: 'Greenland', iso3: 'GRL' },
  { iso: 'GD', name: 'GRENADA', nicename: 'Grenada', iso3: 'GRD' },
  { iso: 'GP', name: 'GUADELOUPE', nicename: 'Guadeloupe', iso3: 'GLP' },
  { iso: 'GU', name: 'GUAM', nicename: 'Guam', iso3: 'GUM' },
  { iso: 'GT', name: 'GUATEMALA', nicename: 'Guatemala', iso3: 'GTM' },
  { iso: 'GN', name: 'GUINEA', nicename: 'Guinea', iso3: 'GIN' },
  { iso: 'GW', name: 'GUINEA-BISSAU', nicename: 'Guinea-Bissau', iso3: 'GNB' },
  { iso: 'GY', name: 'GUYANA', nicename: 'Guyana', iso3: 'GUY' },
  { iso: 'HT', name: 'HAITI', nicename: 'Haiti', iso3: 'HTI' },
  {
    iso: 'HM',
    name: 'HEARD ISLAND AND MCDONALD ISLANDS',
    nicename: 'Heard Island and Mcdonald Islands',
    iso3: null
  },
  {
    iso: 'VA',
    name: 'HOLY SEE (VATICAN CITY STATE)',
    nicename: 'Holy See (Vatican City State)',
    iso3: 'VAT'
  },
  { iso: 'HN', name: 'HONDURAS', nicename: 'Honduras', iso3: 'HND' },
  { iso: 'HK', name: 'HONG KONG', nicename: 'Hong Kong', iso3: 'HKG' },
  { iso: 'HU', name: 'HUNGARY', nicename: 'Hungary', iso3: 'HUN' },
  { iso: 'IS', name: 'ICELAND', nicename: 'Iceland', iso3: 'ISL' },
  { iso: 'IN', name: 'INDIA', nicename: 'India', iso3: 'IND' },
  { iso: 'ID', name: 'INDONESIA', nicename: 'Indonesia', iso3: 'IDN' },
  { iso: 'IR', name: 'IRAN, ISLAMIC REPUBLIC OF', nicename: 'Iran, Islamic Republic of', iso3: 'IRN' },
  { iso: 'IQ', name: 'IRAQ', nicename: 'Iraq', iso3: 'IRQ' },
  { iso: 'IE', name: 'IRELAND', nicename: 'Ireland', iso3: 'IRL' },
  { iso: 'IL', name: 'ISRAEL', nicename: 'Israel', iso3: 'ISR' },
  { iso: 'IT', name: 'ITALY', nicename: 'Italy', iso3: 'ITA' },
  { iso: 'JM', name: 'JAMAICA', nicename: 'Jamaica', iso3: 'JAM' },
  { iso: 'JP', name: 'JAPAN', nicename: 'Japan', iso3: 'JPN' },
  { iso: 'JO', name: 'JORDAN', nicename: 'Jordan', iso3: 'JOR' },
  { iso: 'KZ', name: 'KAZAKHSTAN', nicename: 'Kazakhstan', iso3: 'KAZ' },
  { iso: 'KE', name: 'KENYA', nicename: 'Kenya', iso3: 'KEN' },
  { iso: 'KI', name: 'KIRIBATI', nicename: 'Kiribati', iso3: 'KIR' },
  {
    iso: 'KP',
    name: 'KOREA, DEMOCRATIC PEOPLES REPUBLIC OF',
    nicename: 'Korea, Democratic Peoples Republic of',
    iso3: 'PRK'
  },
  { iso: 'KR', name: 'KOREA, REPUBLIC OF', nicename: 'Korea, Republic of', iso3: 'KOR' },
  { iso: 'KW', name: 'KUWAIT', nicename: 'Kuwait', iso3: 'KWT' },
  { iso: 'KG', name: 'KYRGYZSTAN', nicename: 'Kyrgyzstan', iso3: 'KGZ' },
  {
    iso: 'LA',
    name: 'LAO PEOPLES DEMOCRATIC REPUBLIC',
    nicename: 'Lao Peoples Democratic Republic',
    iso3: 'LAO'
  },
  { iso: 'LV', name: 'LATVIA', nicename: 'Latvia', iso3: 'LVA' },
  { iso: 'LB', name: 'LEBANON', nicename: 'Lebanon', iso3: 'LBN' },
  { iso: 'LS', name: 'LESOTHO', nicename: 'Lesotho', iso3: 'LSO' },
  { iso: 'LR', name: 'LIBERIA', nicename: 'Liberia', iso3: 'LBR' },
  { iso: 'LY', name: 'LIBYAN ARAB JAMAHIRIYA', nicename: 'Libyan Arab Jamahiriya', iso3: 'LBY' },
  { iso: 'LI', name: 'LIECHTENSTEIN', nicename: 'Liechtenstein', iso3: 'LIE' },
  { iso: 'LT', name: 'LITHUANIA', nicename: 'Lithuania', iso3: 'LTU' },
  { iso: 'LU', name: 'LUXEMBOURG', nicename: 'Luxembourg', iso3: 'LUX' },
  { iso: 'MO', name: 'MACAO', nicename: 'Macao', iso3: 'MAC' },
  {
    iso: 'MK',
    name: 'MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF',
    nicename: 'Macedonia, the Former Yugoslav Republic of',
    iso3: 'MKD'
  },
  { iso: 'MG', name: 'MADAGASCAR', nicename: 'Madagascar', iso3: 'MDG' },
  { iso: 'MW', name: 'MALAWI', nicename: 'Malawi', iso3: 'MWI' },
  { iso: 'MY', name: 'MALAYSIA', nicename: 'Malaysia', iso3: 'MYS' },
  { iso: 'MV', name: 'MALDIVES', nicename: 'Maldives', iso3: 'MDV' },
  { iso: 'ML', name: 'MALI', nicename: 'Mali', iso3: 'MLI' },
  { iso: 'MT', name: 'MALTA', nicename: 'Malta', iso3: 'MLT' },
  { iso: 'MH', name: 'MARSHALL ISLANDS', nicename: 'Marshall Islands', iso3: 'MHL' },
  { iso: 'MQ', name: 'MARTINIQUE', nicename: 'Martinique', iso3: 'MTQ' },
  { iso: 'MR', name: 'MAURITANIA', nicename: 'Mauritania', iso3: 'MRT' },
  { iso: 'MU', name: 'MAURITIUS', nicename: 'Mauritius', iso3: 'MUS' },
  { iso: 'YT', name: 'MAYOTTE', nicename: 'Mayotte', iso3: null },
  { iso: 'MX', name: 'MEXICO', nicename: 'Mexico', iso3: 'MEX' },
  {
    iso: 'FM',
    name: 'MICRONESIA, FEDERATED STATES OF',
    nicename: 'Micronesia, Federated States of',
    iso3: 'FSM'
  },
  { iso: 'MD', name: 'MOLDOVA, REPUBLIC OF', nicename: 'Moldova, Republic of', iso3: 'MDA' },
  { iso: 'MC', name: 'MONACO', nicename: 'Monaco', iso3: 'MCO' },
  { iso: 'MN', name: 'MONGOLIA', nicename: 'Mongolia', iso3: 'MNG' },
  { iso: 'MS', name: 'MONTSERRAT', nicename: 'Montserrat', iso3: 'MSR' },
  { iso: 'MA', name: 'MOROCCO', nicename: 'Morocco', iso3: 'MAR' },
  { iso: 'MZ', name: 'MOZAMBIQUE', nicename: 'Mozambique', iso3: 'MOZ' },
  { iso: 'MM', name: 'MYANMAR', nicename: 'Myanmar', iso3: 'MMR' },
  { iso: 'NA', name: 'NAMIBIA', nicename: 'Namibia', iso3: 'NAM' },
  { iso: 'NR', name: 'NAURU', nicename: 'Nauru', iso3: 'NRU' },
  { iso: 'NP', name: 'NEPAL', nicename: 'Nepal', iso3: 'NPL' },
  { iso: 'NL', name: 'NETHERLANDS', nicename: 'Netherlands', iso3: 'NLD' },
  { iso: 'AN', name: 'NETHERLANDS ANTILLES', nicename: 'Netherlands Antilles', iso3: 'ANT' },
  { iso: 'NC', name: 'NEW CALEDONIA', nicename: 'New Caledonia', iso3: 'NCL' },
  { iso: 'NZ', name: 'NEW ZEALAND', nicename: 'New Zealand', iso3: 'NZL' },
  { iso: 'NI', name: 'NICARAGUA', nicename: 'Nicaragua', iso3: 'NIC' },
  { iso: 'NE', name: 'NIGER', nicename: 'Niger', iso3: 'NER' },
  { iso: 'NG', name: 'NIGERIA', nicename: 'Nigeria', iso3: 'NGA' },
  { iso: 'NU', name: 'NIUE', nicename: 'Niue', iso3: 'NIU' },
  { iso: 'NF', name: 'NORFOLK ISLAND', nicename: 'Norfolk Island', iso3: 'NFK' },
  { iso: 'MP', name: 'NORTHERN MARIANA ISLANDS', nicename: 'Northern Mariana Islands', iso3: 'MNP' },
  { iso: 'NO', name: 'NORWAY', nicename: 'Norway', iso3: 'NOR' },
  { iso: 'OM', name: 'OMAN', nicename: 'Oman', iso3: 'OMN' },
  { iso: 'PK', name: 'PAKISTAN', nicename: 'Pakistan', iso3: 'PAK' },
  { iso: 'PW', name: 'PALAU', nicename: 'Palau', iso3: 'PLW' },
  {
    iso: 'PS',
    name: 'PALESTINIAN TERRITORY, OCCUPIED',
    nicename: 'Palestinian Territory, Occupied',
    iso3: null
  },
  { iso: 'PA', name: 'PANAMA', nicename: 'Panama', iso3: 'PAN' },
  { iso: 'PG', name: 'PAPUA NEW GUINEA', nicename: 'Papua New Guinea', iso3: 'PNG' },
  { iso: 'PY', name: 'PARAGUAY', nicename: 'Paraguay', iso3: 'PRY' },
  { iso: 'PE', name: 'PERU', nicename: 'Peru', iso3: 'PER' },
  { iso: 'PH', name: 'PHILIPPINES', nicename: 'Philippines', iso3: 'PHL' },
  { iso: 'PN', name: 'PITCAIRN', nicename: 'Pitcairn', iso3: 'PCN' },
  { iso: 'PL', name: 'POLAND', nicename: 'Poland', iso3: 'POL' },
  { iso: 'PT', name: 'PORTUGAL', nicename: 'Portugal', iso3: 'PRT' },
  { iso: 'PR', name: 'PUERTO RICO', nicename: 'Puerto Rico', iso3: 'PRI' },
  { iso: 'QA', name: 'QATAR', nicename: 'Qatar', iso3: 'QAT' },
  { iso: 'RE', name: 'REUNION', nicename: 'Reunion', iso3: 'REU' },
  { iso: 'RO', name: 'ROMANIA', nicename: 'Romania', iso3: 'ROM' },
  { iso: 'RU', name: 'RUSSIAN FEDERATION', nicename: 'Russian Federation', iso3: 'RUS' },
  { iso: 'RW', name: 'RWANDA', nicename: 'Rwanda', iso3: 'RWA' },
  { iso: 'SH', name: 'SAINT HELENA', nicename: 'Saint Helena', iso3: 'SHN' },
  { iso: 'KN', name: 'SAINT KITTS AND NEVIS', nicename: 'Saint Kitts and Nevis', iso3: 'KNA' },
  { iso: 'LC', name: 'SAINT LUCIA', nicename: 'Saint Lucia', iso3: 'LCA' },
  { iso: 'PM', name: 'SAINT PIERRE AND MIQUELON', nicename: 'Saint Pierre and Miquelon', iso3: 'SPM' },
  {
    iso: 'VC',
    name: 'SAINT VINCENT AND THE GRENADINES',
    nicename: 'Saint Vincent and the Grenadines',
    iso3: 'VCT'
  },
  { iso: 'WS', name: 'SAMOA', nicename: 'Samoa', iso3: 'WSM' },
  { iso: 'SM', name: 'SAN MARINO', nicename: 'San Marino', iso3: 'SMR' },
  { iso: 'ST', name: 'SAO TOME AND PRINCIPE', nicename: 'Sao Tome and Principe', iso3: 'STP' },
  { iso: 'SA', name: 'SAUDI ARABIA', nicename: 'Saudi Arabia', iso3: 'SAU' },
  { iso: 'SN', name: 'SENEGAL', nicename: 'Senegal', iso3: 'SEN' },
  { iso: 'CS', name: 'SERBIA AND MONTENEGRO', nicename: 'Serbia and Montenegro', iso3: null },
  { iso: 'SC', name: 'SEYCHELLES', nicename: 'Seychelles', iso3: 'SYC' },
  { iso: 'SL', name: 'SIERRA LEONE', nicename: 'Sierra Leone', iso3: 'SLE' },
  { iso: 'SG', name: 'SINGAPORE', nicename: 'Singapore', iso3: 'SGP' },
  { iso: 'SK', name: 'SLOVAKIA', nicename: 'Slovakia', iso3: 'SVK' },
  { iso: 'SI', name: 'SLOVENIA', nicename: 'Slovenia', iso3: 'SVN' },
  { iso: 'SB', name: 'SOLOMON ISLANDS', nicename: 'Solomon Islands', iso3: 'SLB' },
  { iso: 'SO', name: 'SOMALIA', nicename: 'Somalia', iso3: 'SOM' },
  { iso: 'ZA', name: 'SOUTH AFRICA', nicename: 'South Africa', iso3: 'ZAF' },
  {
    iso: 'GS',
    name: 'SOUTH GEORGIA AND THE SOUTH SANDWICH ISLANDS',
    nicename: 'South Georgia and the South Sandwich Islands',
    iso3: null
  },
  { iso: 'ES', name: 'SPAIN', nicename: 'Spain', iso3: 'ESP' },
  { iso: 'LK', name: 'SRI LANKA', nicename: 'Sri Lanka', iso3: 'LKA' },
  { iso: 'SD', name: 'SUDAN', nicename: 'Sudan', iso3: 'SDN' },
  { iso: 'SR', name: 'SURINAME', nicename: 'Suriname', iso3: 'SUR' },
  { iso: 'SJ', name: 'SVALBARD AND JAN MAYEN', nicename: 'Svalbard and Jan Mayen', iso3: 'SJM' },
  { iso: 'SZ', name: 'SWAZILAND', nicename: 'Swaziland', iso3: 'SWZ' },
  { iso: 'SE', name: 'SWEDEN', nicename: 'Sweden', iso3: 'SWE' },
  { iso: 'CH', name: 'SWITZERLAND', nicename: 'Switzerland', iso3: 'CHE' },
  { iso: 'SY', name: 'SYRIAN ARAB REPUBLIC', nicename: 'Syrian Arab Republic', iso3: 'SYR' },
  { iso: 'TW', name: 'TAIWAN, PROVINCE OF CHINA', nicename: 'Taiwan, Province of China', iso3: 'TWN' },
  { iso: 'TJ', name: 'TAJIKISTAN', nicename: 'Tajikistan', iso3: 'TJK' },
  {
    iso: 'TZ',
    name: 'TANZANIA, UNITED REPUBLIC OF',
    nicename: 'Tanzania, United Republic of',
    iso3: 'TZA'
  },
  { iso: 'TH', name: 'THAILAND', nicename: 'Thailand', iso3: 'THA' },
  { iso: 'TL', name: 'TIMOR-LESTE', nicename: 'Timor-Leste', iso3: null },
  { iso: 'TG', name: 'TOGO', nicename: 'Togo', iso3: 'TGO' },
  { iso: 'TK', name: 'TOKELAU', nicename: 'Tokelau', iso3: 'TKL' },
  { iso: 'TO', name: 'TONGA', nicename: 'Tonga', iso3: 'TON' },
  { iso: 'TT', name: 'TRINIDAD AND TOBAGO', nicename: 'Trinidad and Tobago', iso3: 'TTO' },
  { iso: 'TN', name: 'TUNISIA', nicename: 'Tunisia', iso3: 'TUN' },
  { iso: 'TR', name: 'TURKEY', nicename: 'Turkey', iso3: 'TUR' },
  { iso: 'TM', name: 'TURKMENISTAN', nicename: 'Turkmenistan', iso3: 'TKM' },
  { iso: 'TC', name: 'TURKS AND CAICOS ISLANDS', nicename: 'Turks and Caicos Islands', iso3: 'TCA' },
  { iso: 'TV', name: 'TUVALU', nicename: 'Tuvalu', iso3: 'TUV' },
  { iso: 'UG', name: 'UGANDA', nicename: 'Uganda', iso3: 'UGA' },
  { iso: 'UA', name: 'UKRAINE', nicename: 'Ukraine', iso3: 'UKR' },
  { iso: 'AE', name: 'UNITED ARAB EMIRATES', nicename: 'United Arab Emirates', iso3: 'ARE' },
  { iso: 'GB', name: 'UNITED KINGDOM', nicename: 'United Kingdom', iso3: 'GBR' },
  { iso: 'US', name: 'UNITED STATES', nicename: 'United States', iso3: 'USA' },
  {
    iso: 'UM',
    name: 'UNITED STATES MINOR OUTLYING ISLANDS',
    nicename: 'United States Minor Outlying Islands',
    iso3: null
  },
  { iso: 'UY', name: 'URUGUAY', nicename: 'Uruguay', iso3: 'URY' },
  { iso: 'UZ', name: 'UZBEKISTAN', nicename: 'Uzbekistan', iso3: 'UZB' },
  { iso: 'VU', name: 'VANUATU', nicename: 'Vanuatu', iso3: 'VUT' },
  { iso: 'VE', name: 'VENEZUELA', nicename: 'Venezuela', iso3: 'VEN' },
  { iso: 'VN', name: 'VIET NAM', nicename: 'Viet Nam', iso3: 'VNM' },
  { iso: 'VG', name: 'VIRGIN ISLANDS, BRITISH', nicename: 'Virgin Islands, British', iso3: 'VGB' },
  { iso: 'VI', name: 'VIRGIN ISLANDS, U.S.', nicename: 'Virgin Islands, U.s.', iso3: 'VIR' },
  { iso: 'WF', name: 'WALLIS AND FUTUNA', nicename: 'Wallis and Futuna', iso3: 'WLF' },
  { iso: 'EH', name: 'WESTERN SAHARA', nicename: 'Western Sahara', iso3: 'ESH' },
  { iso: 'YE', name: 'YEMEN', nicename: 'Yemen', iso3: 'YEM' },
  { iso: 'ZM', name: 'ZAMBIA', nicename: 'Zambia', iso3: 'ZMB' },
  { iso: 'ZW', name: 'ZIMBABWE', nicename: 'Zimbabwe', iso3: 'ZWE' }
]
