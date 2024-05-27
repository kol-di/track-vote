# Use an official Node runtime as a parent image
FROM node:20.13-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# # Copy the rest of the application code
# COPY . .
COPY tailwind.config.js postcss.config.mjs next.config.mjs jsconfig.json jest*.js babel.config.jest.js \
    .eslintrc.json .env ./
COPY src ./src
COPY server ./server
COPY public ./public

# Install localtunnel globally
RUN npm install -g localtunnel

# Install curl to get lt password
RUN apt-get -y update; apt-get -y install curl

# Expose the port your app runs on
EXPOSE 3000

# Copy the startup script
COPY start.sh ./
RUN chmod +x start.sh

# Command to run your application
CMD ["./start.sh"]
