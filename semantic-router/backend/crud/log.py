from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from .base import CRUDBase
from ..models import Log
from ..schemas import LogBase


class CRUDLog(CRUDBase[Log, LogBase, LogBase]):
    def cleanup_old_logs(self, db: Session, retention_days: int) -> int:
        cutoff_date = datetime.utcnow() - timedelta(days=retention_days)
        deleted_count = (
            db.query(self.model)
            .filter(self.model.timestamp < cutoff_date)
            .delete(synchronize_session=False)
        )
        db.commit()
        return deleted_count


log = CRUDLog(Log)
