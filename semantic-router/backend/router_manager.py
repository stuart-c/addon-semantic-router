import logging
from typing import Optional
from sqlalchemy.orm import Session

try:
    from semantic_router import Route
    from semantic_router.layer import RouteLayer
    from semantic_router.encoders import HuggingFaceEncoder, TfidfEncoder

    SEMANTIC_ROUTER_AVAILABLE = True
except ImportError:
    SEMANTIC_ROUTER_AVAILABLE = False

    # Mock classes for type hinting or safety
    class Route:
        pass

    class RouteLayer:
        pass

    class HuggingFaceEncoder:
        pass

    class TfidfEncoder:
        pass


from . import models

logger = logging.getLogger(__name__)


class RouteLayerManager:
    _instance: Optional["RouteLayerManager"] = None
    _router: Optional[RouteLayer] = None
    _encoder: Optional[any] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RouteLayerManager, cls).__new__(cls)
        return cls._instance

    def initialize(self, db: Session):
        """Initialize the RouteLayer with data from the database."""
        if not SEMANTIC_ROUTER_AVAILABLE:
            logger.warning("semantic-router library not found. Routing is disabled.")
            return

        logger.info("Initializing Semantic Router Layer...")
        try:
            if self._encoder is None:
                # Initialize encoder only once
                try:
                    # Prefer HuggingFaceEncoder if dependencies (torch) are present
                    self._encoder = HuggingFaceEncoder(name="all-MiniLM-L6-v2")
                    logger.info("Using HuggingFaceEncoder for semantic routing.")
                except Exception as e:
                    # Fallback to TfidfEncoder which is lightweight and torch-free
                    logger.warning(
                        f"HuggingFaceEncoder not available ({e}). Using TfidfEncoder."
                    )
                    self._encoder = TfidfEncoder()

            # Fetch enabled routes from DB
            db_routes = db.query(models.Route).filter(models.Route.enabled).all()

            router_routes = []
            for db_route in db_routes:
                utterances = [u.utterance for u in db_route.utterances]
                if utterances:
                    router_routes.append(
                        Route(name=db_route.name, utterances=utterances)
                    )

            if router_routes:
                self._router = RouteLayer(encoder=self._encoder, routes=router_routes)
                logger.info(f"RouteLayer initialized with {len(router_routes)} routes.")
            else:
                self._router = None
                logger.warning("No routes found in database. RouteLayer is disabled.")

        except Exception as e:
            logger.error(f"Failed to initialize RouteLayer: {e}", exc_info=True)
            self._router = None

    def refresh(self, db: Session):
        """Refresh the RouteLayer with latest data from the database."""
        self.initialize(db)

    def get_router(self) -> Optional[RouteLayer]:
        """Return the current RouteLayer instance."""
        return self._router

    def get_route_name(self, query_text: str) -> Optional[str]:
        """Determine the route for a given query."""
        if self._router is None:
            return None

        try:
            route_choice = self._router(query_text)
            return route_choice.name
        except Exception as e:
            logger.error(f"Error during semantic routing: {e}")
            return None


router_manager = RouteLayerManager()
