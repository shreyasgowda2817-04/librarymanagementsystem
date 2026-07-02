FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the frontend
RUN npm run build

# Start the server (Assuming production script exists or we use node directly)
CMD ["node", "server/src/server.js"]

EXPOSE 5001
