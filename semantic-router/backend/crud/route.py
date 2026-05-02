from .base import CRUDBase
from ..models import Route
from ..schemas import RouteCreate, RouteUpdate


class CRUDRoute(CRUDBase[Route, RouteCreate, RouteUpdate]):
    pass


route = CRUDRoute(Route)
