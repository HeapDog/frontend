FROM node:25-trixie

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy rest of the app
COPY . .

# Expose Next.js port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]
