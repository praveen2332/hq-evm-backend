FROM node:16

RUN mkdir -p /home/app/
WORKDIR /home/app/

RUN yarn global add pm2

COPY backend/package*.json ./
COPY backend/yarn.lock ./

RUN yarn add glob rimraf

COPY ./backend .

COPY ./infra/Docker/entrypoint.sh .

RUN tr -d "\015" <./entrypoint.sh >Entrypoint.sh

# COPY ./infra/Docker/.env ./.env

RUN mv Entrypoint.sh entrypoint.sh

RUN chmod +x entrypoint.sh

EXPOSE 80

ENTRYPOINT ./entrypoint.sh