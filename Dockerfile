FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
  chromium \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/chromium /usr/bin/chromium-browser

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 7860

ENV PORT=7860
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

CMD ["node", "server.js"]
