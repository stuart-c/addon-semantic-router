# Semantic Router Service

This directory contains the core logic for the Semantic Router service, including the backend API and the management frontend.

## Components

### [Backend](./backend)
A FastAPI application that provides:
- CRUD endpoints for LLMs, Routes, and Utterances.
- Semantic routing logic (via the `/query` endpoint).
- Logging and configuration management.

### [Frontend](./frontend)
The web interface used to manage the router's configuration.

## Deployment

The service is packaged as a Home Assistant Addon using the [Dockerfile](./Dockerfile).

### Build
To build the backend dependencies locally:
```bash
bash ../scripts/make_backend.sh
```

### Run
To run the service in development mode:
```bash
bash ../scripts/run_dev.sh
```

## Configuration
The service is configured via `config.yaml` for Home Assistant specific settings, and an internal SQLite database for application state.
