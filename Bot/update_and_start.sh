#!/bin/bash

# Define the file path
FILE_PATH=$LOCALTUNNEL_FILE_PATH

# Wait until the LocalTunnel URL file exists
while [ ! -f $FILE_PATH ]; do
  echo "Waiting for LocalTunnel URL file..."
  sleep 1
done

# Read the LocalTunnel URL from the shared file
LT_URL=$(cat $FILE_PATH)

# Update the conf.ini file with the new LocalTunnel URL
sed -i "s|BASE_URL = .*|BASE_URL = $LT_URL|g" conf.ini

# Start the Python bot
python3 main.py
