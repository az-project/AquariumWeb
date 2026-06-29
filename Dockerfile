FROM node:20-alpine

WORKDIR /app

COPY . .

ENV PORT=4174
ENV DATA_DIR=/data

EXPOSE 4174

CMD ["node", "server.js"]
