#!/bin/bash

# Start LocalTunnel and capture the output URL
lt --port 3000 > lturl.txt &
sleep 5
LT_URL=$(cat lturl.txt | grep -o 'https://[^ ]*')

# Write the LocalTunnel URL to a file in the shared volume
echo $LT_URL > /usr/src/shared/localtunnel_url.txt

# Export the LocalTunnel URL as an environment variable
export LOCALTUNNEL_URL=$LT_URL

# Update the web app .env file with the new LocalTunnel URL
sed -i "s|PUBLIC_URL=.*|PUBLIC_URL=$LT_URL|g" .env

# Start the Node.js application
npm run dev
