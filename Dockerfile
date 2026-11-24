FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=3000
ENV OTEL_SERVICE_NAME=aport-api
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318

EXPOSE 3000

CMD ["node", "--require", "./tracing.js", "index.js"]