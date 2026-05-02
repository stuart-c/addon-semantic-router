# Utility Scripts

This directory contains shell scripts for automating development, building, and testing tasks.

## Scripts Overview

### [make_venv.sh](./make_venv.sh)
Creates and configures the Python virtual environment.
- Checks if `.venv` exists, creates it if missing.
- Upgrades `pip`.
- Installs production and development dependencies.

### [make_backend.sh](./make_backend.sh)
Ensures the backend environment is ready for execution.
- Calls `make_venv.sh` to ensure dependencies are installed.

### [run_app.sh](./run_app.sh)
Starts the FastAPI development server and opens the frontend in a browser.
- Ensures the virtual environment exists.
- Sets `PYTHONPATH` to include the `semantic-router` directory.
- Runs `uvicorn` with `--reload` on port 8000.
- Opens `http://localhost:8000` in the default browser using `xdg-open`.

### [run_tests.sh](./run_tests.sh)
Full verification suite (linting and unit tests).
- Ensures the virtual environment exists.
- Runs `black --check` for code formatting.
- Runs `flake8` for linting.
- Runs `pytest` for unit tests with coverage reporting.

### [make_frontend.sh](./make_frontend.sh)
*(Currently a placeholder for future frontend build steps)*

### [make_docker.sh](./make_docker.sh)
Builds the Docker image for the Semantic Router addon.
- Determines repository name automatically.
- Uses the Dockerfile in `semantic-router/`.
- Tags the image as `ghcr.io/<repo>:latest`.

### [run_docker.sh](./run_docker.sh)
Runs the Docker image locally and opens the frontend in a browser.
- Builds the image if missing.
- Removes any existing `semantic-router-dev` container.
- Starts a container exposing port 8000.
- Opens `http://localhost:8000` via `xdg-open`.
