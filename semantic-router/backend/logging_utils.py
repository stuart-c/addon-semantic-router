import logging
import os


def get_logging_level(level_str: str):
    if not level_str:
        return logging.INFO
    level_map = {
        "debug": logging.DEBUG,
        "info": logging.INFO,
        "warning": logging.WARNING,
        "error": logging.ERROR,
        "critical": logging.CRITICAL,
        "all": logging.DEBUG,
        "default": logging.INFO,
    }
    return level_map.get(level_str.lower(), logging.INFO)


def setup_logging():
    # Read log level from environment variable set by run.sh (via bashio)
    log_level_str = os.getenv("LOG_LEVEL", "info")

    level = get_logging_level(log_level_str)

    # Configure root logger
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        force=True,
    )

    # Set levels for specific loggers
    logging.getLogger("uvicorn").setLevel(level)
    logging.getLogger("fastapi").setLevel(level)

    logger = logging.getLogger(__name__)
    logger.info(
        f"Application logging initialized with level: {log_level_str} "
        "(from LOG_LEVEL env)"
    )


def update_log_level(level_str: str):
    # This might still be useful if we want to change it via some other way,
    # but for now we'll only call it if needed.
    level = get_logging_level(level_str)
    logging.getLogger().setLevel(level)
    logging.getLogger("uvicorn").setLevel(level)
    logging.getLogger("fastapi").setLevel(level)
