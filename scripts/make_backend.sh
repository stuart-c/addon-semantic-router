#!/bin/bash
set -e

echo "Building backend..."

# Call make_venv.sh to ensure environment is ready
bash scripts/make_venv.sh

echo "Backend build complete."
