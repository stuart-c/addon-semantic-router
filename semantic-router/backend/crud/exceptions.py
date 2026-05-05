class CRUDError(Exception):
    """Base class for CRUD errors."""

    pass


class IntegrityViolationError(CRUDError):
    """Raised when a CRUD operation violates data integrity constraints."""

    pass
