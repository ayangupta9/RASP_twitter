#!/bin/bash

cd ./python_server/

# Check if the BEiT_XAI directory exists
if [ -d "BEiT_XAI" ]; then
  echo "BEiT_XAI directory exists."

  # Check if the BEiT_XAI directory has any files
  if [ "$(ls -A BEiT_XAI)" ]; then
    echo "BEiT_XAI directory contains files."
  else
    echo "BEiT_XAI directory is empty."
  fi
else
  echo "BEiT_XAI directory does not exist."
  
  # Run the download.sh script from the parent directory
  echo "Running download.sh script to fetch BEiT_XAI directory..."
  cd ..
  if [ -f "download.sh" ]; then
    bash download.sh
  else
    echo "download.sh script not found in the parent directory."
    exit 1
  fi

  # Return to the python_server directory
  cd ./python_server/
fi

# Run the Python server script
python server.py
