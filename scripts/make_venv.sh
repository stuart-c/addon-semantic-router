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
./.venv/bin/pip install nodeenv

# Set up nodeenv
echo "Setting up Node.js environment (LTS)..."
./.venv/bin/nodeenv -p --node=lts

echo "Virtual environment ready (Python + Node.js)."
