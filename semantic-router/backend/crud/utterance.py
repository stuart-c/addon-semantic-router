from typing import List
from sqlalchemy.orm import Session
from .base import CRUDBase
from ..models import RouteUtterance
from ..schemas import RouteUtteranceCreate, RouteUtteranceUpdate


class CRUDRouteUtterance(
    CRUDBase[RouteUtterance, RouteUtteranceCreate, RouteUtteranceUpdate]
):
    def get_by_route(self, db: Session, route_id: int) -> List[RouteUtterance]:
        return db.query(self.model).filter(self.model.route_id == route_id).all()

    def get_by_route_and_id(
        self, db: Session, route_id: int, id: int
    ) -> RouteUtterance:
        return (
            db.query(self.model)
            .filter(self.model.route_id == route_id, self.model.id == id)
            .first()
        )


utterance = CRUDRouteUtterance(RouteUtterance)
