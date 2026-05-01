#!/bin/bash
set -e

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Upgrade pip
echo "Upgrading pip..."
./.venv/bin/pip install --upgrade pip

# Install dependencies
echo "Installing backend dependencies..."
./.venv/bin/pip install -r semantic-router/backend/requirements.txt
./.venv/bin/pip install -r semantic-router/backend/requirements_test.txt

echo "Virtual environment ready."
