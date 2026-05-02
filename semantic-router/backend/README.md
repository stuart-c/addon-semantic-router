# Semantic Router Backend

The backend is built with FastAPI and SQLAlchemy 2.0.

## Project Structure

- `main.py`: Application entry point and route inclusion.
- `models.py`: SQLAlchemy database models.
- `schemas.py`: Pydantic validation schemas.
- `database.py`: Database connection and session management.
- `crud/`: Generic CRUD implementation module.
- `routes/`: API endpoint definitions.
- `utils.py`: General utility functions.

## Running the Backend

Use the development script from the root:
```bash
bash scripts/run_dev.sh
```

## Running Tests

Use the test script from the root:
```bash
bash scripts/run_tests.sh
```
This script ensures the virtual environment is ready, runs linting with `black` and `flake8`, and executes unit tests with `pytest`.

## CRUD Pattern

We use a generic CRUD pattern to minimize boilerplate. All standard database operations should be implemented in the `crud/` module and used by the routes.

Example usage in a route:
```python
@router.get("/llm/{id}", response_model=schemas.LLM)
def get_llm(id: int, db: Session = Depends(get_db)):
    db_llm = crud.llm.get(db, id=id)
    if not db_llm:
        raise HTTPException(status_code=404, detail="LLM not found")
    return db_llm
```

## Logging

Logging is configured in `logging_utils.py` and respects the `LOG_LEVEL` environment variable.
