#!/bin/bash

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn src.main:app --reload 

pwd 

ls 