from sqlalchemy.orm import Session
from .base import CRUDBase
from ..models import Config, LogLevel
from ..schemas import ConfigBase, ConfigUpdate


class CRUDConfig(CRUDBase[Config, ConfigBase, ConfigUpdate]):
    def get_config(self, db: Session) -> Config:
        db_config = db.query(self.model).first()
        if not db_config:
            db_config = self.model(log_level=LogLevel.default)
            db.add(db_config)
            db.commit()
            db.refresh(db_config)
        return db_config


config = CRUDConfig(Config)
