## Flowstation backend

- Nest 8
- Passport 0.5.2
- JEST (for backend testing)
- Postgres
- All typescript

Prerequisites:

- Install Postgresql: https://www.postgresql.org/download/
- Install Postgresql GUI: https://www.pgadmin.org/download/
- Setup your credential for your local database
- Create an database (example: flowstation)

Please make sure you have the correct .env file (setup your Postgres database credential)
```bash
BASE_URL=http://localhost:3001/api/v1
DATABASE_URL=postgresql://{username}:{password}@{host}:{port}/{database}
DATABASE_LOGGING=true
DATABASE_ENTITIES=dist/**/*.entity.js
DATABASE_MIGRATIONS=dist/migrations/*.js
DATABASE_MIGRATIONS_TABLE_NAME=migrations_history
```

To run the backend code, see the script below (make sure you are in the backend folder):

```bash
# install packages
yarn
# run project
yarn start:dev
```

To run database migration, please run this command
```bash
# migration down
yarn migrate:down
# run project
yarn migrate:up
```
