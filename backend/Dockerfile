FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p uploads

ENV NODE_ENV=production
EXPOSE 8000

CMD ["node", "app/index.js"]
