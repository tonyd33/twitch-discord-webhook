FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install

ENV PORT=8080
ENV PROD=1

CMD ["node", "index.js"]

