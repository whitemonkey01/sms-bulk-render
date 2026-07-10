FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  chromium \
  libxshmfence-dev \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libexpat1 \
  libxcb1 \
  libxkbcommon0 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/chromium /usr/bin/chromium-browser

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 7860

ENV PORT=7860
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "server.js"]
