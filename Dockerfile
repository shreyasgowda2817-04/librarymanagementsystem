FROM node:20-alpine

WORKDIR /app

# Copy the entire project
COPY . .

# Install frontend dependencies and build
RUN npm install
RUN npm run build

# Install backend dependencies
WORKDIR /app/server
RUN npm install

# Start the backend server
CMD ["node", "src/server.js"]

EXPOSE 5001
