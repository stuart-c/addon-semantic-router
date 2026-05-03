import logging
import os
from typing import Optional
from sqlalchemy.orm import Session

try:
    from semantic_router import Route
    from semantic_router.layer import RouteLayer
    from semantic_router.encoders import FastEmbedEncoder

    SEMANTIC_ROUTER_AVAILABLE = True
except ImportError:
    SEMANTIC_ROUTER_AVAILABLE = False

    # Mock classes for type hinting or safety
    class Route:
        pass

    class RouteLayer:
        pass

    class FastEmbedEncoder:
        def __init__(self, *args, **kwargs):
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
                    # In Home Assistant, /data is persistent. For local dev, use ./data.
                    base_data_dir = "/data" if os.path.exists("/data") else "./data"
                    cache_dir = os.path.join(base_data_dir, "models")
                    os.makedirs(cache_dir, exist_ok=True)

                    logger.info(
                        f"Initializing FastEmbedEncoder with cache at {cache_dir}..."
                    )
                    self._encoder = FastEmbedEncoder(
                        name="BAAI/bge-small-en-v1.5", cache_dir=cache_dir
                    )
                    logger.info("FastEmbedEncoder (ONNX) initialized.")
                except Exception as e:
                    logger.error(f"Failed to initialize FastEmbedEncoder: {e}")
                    self._encoder = None

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
