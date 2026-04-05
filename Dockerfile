FROM node:20.10.0-slim

WORKDIR /usr/src/solven

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3007 3008
