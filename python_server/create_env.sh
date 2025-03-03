#!/usr/bin/env bash

ENV_NAME="x_sens_env"

# Python version
PYTHON_VERSION="3.9"

eval "$(conda shell.bash hook)"

echo "Creating Conda environment: $ENV_NAME with Python $PYTHON_VERSION..."
conda create -n $ENV_NAME python=$PYTHON_VERSION  -y

echo "Activating the environment..."
conda activate $ENV_NAME

echo "Installing dependencies using Conda..."

# Install torch and torchvision
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia -y

# Install albumentations, matplotlib, imageio, flask, flask-cors
conda install matplotlib -c conda-forge -y
conda install flask -y
pip install flask-cors albumentations imageio transformers pymongo dotenv

echo "All dependencies installed successfully in the Conda environment: $ENV_NAME."
echo "Activate the environment using 'conda activate $ENV_NAME' before running your script."

conda deactivate
