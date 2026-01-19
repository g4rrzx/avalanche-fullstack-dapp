# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install dependencies
# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
npm install -g pnpm

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm install --frozen-lockfile && npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
