from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Any, Dict, Union
from .base import CRUDBase
from ..models import Log
from ..schemas import LogBase


class CRUDLog(CRUDBase[Log, LogBase, LogBase]):
    def create(self, db: Session, *, obj_in: Union[LogBase, Dict[str, Any]]) -> Log:
        if isinstance(obj_in, dict):
            obj_in_data = obj_in
        else:
            obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

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
