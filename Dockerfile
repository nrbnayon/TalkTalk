FROM node:14

WORKDIR /usr/src

COPY package*.json ./

RUN yarn install

COPY . .

EXPOSE 3000

CMD [ "node", "src/server.ts" ]