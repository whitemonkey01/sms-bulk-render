FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install && npx playwright install chromium --with-deps

COPY . .

EXPOSE 7860

ENV PORT=7860

CMD ["node", "server.js"]
