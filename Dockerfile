FROM node:20-bookworm-slim

WORKDIR /app

RUN npx -y playwright install chromium --with-deps

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 7860

ENV PORT=7860

CMD ["node", "server.js"]
