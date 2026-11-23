FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy backend source code
COPY . .

EXPOSE 5001

# Apply migrations before starting the server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seedProfessor.js && npm start"]