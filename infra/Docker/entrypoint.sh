npm run build
export DATABASE_URL=postgresql://${USER_NAME_DATABASE}:${PASSWORD_DATABASE}@${ENDPOINT_DATABASE}/${NAME_DATABASE}
pm2 start dist/main.js --time
pm2 log main