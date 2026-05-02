#!/bin/bash
set -e

# Ensure Docker image exists (build if missing)
REPO_NAME=$(basename "$(pwd)")
IMAGE_NAME="ghcr.io/${REPO_NAME}:latest"

if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
  echo "Docker image not found. Building..."
  bash scripts/make_docker.sh
fi

# Remove any existing container with the same name
if docker ps -a --format '{{.Names}}' | grep -q '^semantic-router-dev$'; then
  echo "Removing existing container..."
  docker rm -f semantic-router-dev
fi

# Run the container in detached mode, exposing port 8000
docker run -d --name semantic-router-dev -p 8000:8000 "$IMAGE_NAME"

# Give the service a moment to start
sleep 3

# Open the frontend in the default browser
xdg-open http://localhost:8000
