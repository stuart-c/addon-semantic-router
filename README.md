# Semantic Router Home Assistant Addon

A powerful, locally-hosted semantic router for Home Assistant. This addon allows you to intelligently route LLM queries to different providers (OpenAI, Local LLMs, etc.) based on the user's intent.

## Features

- **Semantic Routing**: Automatically detect user intent and route queries to the most appropriate LLM or service.
- **LLM Management**: Configure and manage multiple LLM providers.
- **Route Configuration**: Define custom routes with example utterances.
- **Logging & Analytics**: Track query history and routing performance.
- **Home Assistant Integration**: Seamlessly integrates with the HASS ecosystem.

## Architecture

The project is structured as follows:

- `semantic-router/`: Core service directory.
  - `backend/`: FastAPI-based REST API.
  - `frontend/`: Web interface for management.
- `scripts/`: Utility scripts for development and deployment.

## Local Development

Always use the provided scripts for development tasks:

### Prerequisites
- Python 3.11+
- Home Assistant (for addon deployment)

### Setup
```bash
bash scripts/make_venv.sh
```

### Running the Backend
```bash
bash scripts/run_dev.sh
```
This will start the FastAPI server with auto-reload enabled.

### Testing & Linting
```bash
bash scripts/run_tests.sh
```
This runs `black`, `flake8`, and `pytest`.

## Development Guidelines

See [AGENTS.md](./AGENTS.md) for detailed development standards and architectural patterns.

## License

This project is licensed under the Apache License 2.0.