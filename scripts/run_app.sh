#!/bin/bash
set -e

# Ensure virtual environment exists
if [ ! -d ".venv" ]; then
    bash scripts/make_venv.sh
fi

echo "Starting development server..."
export PYTHONPATH=$PYTHONPATH:$(pwd)/semantic-router
# Run uvicorn in background
./.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
# Give server a moment to start
sleep 2
# Open frontend in default browser
xdg-open http://localhost:8000
