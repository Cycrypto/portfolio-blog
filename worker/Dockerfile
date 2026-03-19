FROM node:20-alpine

WORKDIR /app

COPY package.json ./package.json
COPY server.js ./server.js
COPY src ./src

EXPOSE 11434

CMD ["node", "server.js"]
