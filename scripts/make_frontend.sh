#!/bin/bash
set -e

# Ensure venv exists
if [ ! -d ".venv" ]; then
    bash scripts/make_venv.sh
fi

# Activate venv for nodeenv
source .venv/bin/activate

# Build the frontend using npm from venv
echo "Building frontend using Node.js from venv..."
cd semantic-router/frontend
npm install
npm run build
cd ../..

echo "Frontend build complete."
