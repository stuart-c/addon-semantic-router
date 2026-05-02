#!/bin/bash
set -e

# Build the Docker image for the Semantic Router addon
# Image name uses the repository name (ghcr.io/<repo>)
REPO_NAME=$(basename "$(pwd)")
IMAGE_NAME="ghcr.io/${REPO_NAME}:latest"

# Ensure Dockerfile exists
if [ ! -f ./semantic-router/Dockerfile ]; then
  echo "Dockerfile not found in ./semantic-router/"
  exit 1
fi

# Build the Docker image
docker build -t "$IMAGE_NAME" ./semantic-router

echo "Docker image built: $IMAGE_NAME"
