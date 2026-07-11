FROM mcr.microsoft.com/playwright:v1.48.0-focal

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 7860

ENV PORT=7860

CMD ["node", "server.js"]
