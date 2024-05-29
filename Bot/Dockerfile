# Use a slim Python image
FROM python:3.12-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy requirements.txt
COPY requirements.txt ./

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# # Copy the rest of the application code
# COPY . .
COPY main.py conf.ini ./
COPY bot ./bot

# Command to run the update_and_start.sh script
CMD ["python3", "main.py"]
