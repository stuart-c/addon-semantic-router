# Agent Guidelines for Semantic Router Addon

Welcome, fellow agent! This document outlines the technical standards, architectural patterns, and development workflows for the Semantic Router Home Assistant Addon.

## Technology Stack

- **Backend**: Python 3.11+ with [FastAPI](https://fastapi.tiangolo.com/).
- **Database**: SQLite with [SQLAlchemy 2.0](https://www.sqlalchemy.org/).
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/).
- **Frontend**: Vanilla JavaScript/TypeScript (Lit-based elements planned).
- **Environment**: Home Assistant Addon ecosystem (Alpine-based Docker).

## Architectural Patterns

### CRUD Pattern
We use a decoupled CRUD pattern to separate API logic from data access:
- **Base Class**: `backend/crud/base.py` contains `CRUDBase`, a generic class for standard operations.
- **Implementations**: Specific models (LLM, Route, etc.) have their own files in `backend/crud/` inheriting from `CRUDBase`.
- **Routes**: API handlers in `backend/routes/crud.py` should only handle HTTP concerns and delegate data operations to the CRUD module.

### Persistence
- In production (HASS), data is stored in `/data/semantic_router.db`.
- Local development uses `./data/semantic_router.db`.
- SQLite is configured with WAL mode for better concurrency.

## Development Workflow

### Scripts
Always use the provided scripts for common tasks:
- **Setup Environment**: `bash scripts/make_venv.sh`
- **Build Backend**: `bash scripts/make_backend.sh`
- **Run Development Server**: `bash scripts/run_dev.sh` (Starts FastAPI at port 8000)
- **Run Tests & Linting**: `bash scripts/run_tests.sh`

### Running Tests
**MANDATORY**: Ensure all tests and linting pass before finalizing changes. Goal: maintain 100% unit test code coverage.
```bash
bash scripts/run_tests.sh
```

### Git Workflow
- **Branching**: Update the currently chosen branch. **Do not** create new branches, worktrees, or PRs.
- **Commits**: Use descriptive, conventional commit messages (e.g., `feat: ...`, `fix: ...`, `refactor: ...`).
- **Submission**: Once completed, provide a PR title and description for the user to use when they create the PR.
- **Restrictions**: **Do not** perform `git push` or `git pull`.

## Home Assistant Integration
- **Log Level**: Controlled by the `LOG_LEVEL` environment variable (set by `run.sh` via `bashio`).
- **Options**: The addon configuration is managed through `config.yaml` and HASS options.
- **Ingress**: The frontend should be ingress-aware (use relative paths for API calls).

## Design Principles
- **Maintainability**: Keep routes clean by using the CRUD module.
- **Type Safety**: Use Pydantic schemas for all request/response validation.
- **Visual Excellence**: Any frontend additions should follow premium design standards (rich aesthetics, modern typography, HSL-based colors).

---
*Last updated: 2026-05-02*
