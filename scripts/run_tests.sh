#!/bin/bash
set -e

# Ensure venv exists
if [ ! -d ".venv" ]; then
    bash scripts/make_venv.sh
fi

echo "Running linting (black)..."
./.venv/bin/black --check semantic-router/backend

echo "Running linting (flake8)..."
./.venv/bin/flake8 semantic-router/backend

echo "Running unit tests (pytest)..."
export PYTHONPATH=$PYTHONPATH:$(pwd)/semantic-router
./.venv/bin/pytest semantic-router/backend/tests
echo "Coverage report generated in htmlcov/index.html"
