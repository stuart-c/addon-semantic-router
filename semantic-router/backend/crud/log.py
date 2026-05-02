from .base import CRUDBase
from ..models import Log
from ..schemas import LogBase


class CRUDLog(CRUDBase[Log, LogBase, LogBase]):
    pass


log = CRUDLog(Log)
