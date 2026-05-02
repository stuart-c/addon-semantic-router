import asyncio
import logging
from sqlalchemy import text
from .database import SessionLocal
from .crud import log as crud_log
from .crud import config as crud_config

logger = logging.getLogger(__name__)

# 24 hours in seconds
CLEANUP_INTERVAL = 24 * 60 * 60


async def log_cleanup_task():
    """
    Background task that periodically cleans up old logs and vacuums the database.
    """
    logger.info("Log cleanup background task started")
    while True:
        try:
            db = SessionLocal()
            try:
                # Get retention from config
                config = crud_config.get_config(db)
                retention_days = config.log_retention

                logger.info(f"Starting log cleanup (retention: {retention_days} days)")

                # Delete old logs
                deleted_count = crud_log.cleanup_old_logs(db, retention_days)
                logger.info(f"Deleted {deleted_count} old log entries")

                # Vacuum database
                logger.info("Vacuuming database...")
                db.execute(text("VACUUM"))
                db.commit()
                logger.info("Database vacuum completed")

            finally:
                db.close()

        except Exception as e:
            logger.error(f"Error in log cleanup task: {e}", exc_info=True)

        # Wait for the next interval
        await asyncio.sleep(CLEANUP_INTERVAL)
