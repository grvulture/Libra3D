import logging
import os
import time
import uuid
from threading import Lock

from pymongo.monitoring import CommandListener

logger = logging.getLogger(__name__)


def db_timing_enabled():
    if os.environ.get("ENABLE_DB_TIMING", "").lower() in {"1", "true", "yes"}:
        return True
    if os.environ.get("ENABLE_DB_TIMING", "").lower() in {"0", "false", "no"}:
        return False
    return os.environ.get("ENVIRONMENT", os.environ.get("APP_ENV", "development")).lower() in {
        "development",
        "dev",
        "test",
    }


class DatabaseTimingListener(CommandListener):
    def __init__(self):
        self._starts = {}
        self._lock = Lock()

    def started(self, event):
        if not db_timing_enabled():
            return
        with self._lock:
            self._starts[event.request_id] = time.perf_counter()

    def succeeded(self, event):
        self._finish(event, "succeeded")

    def failed(self, event):
        self._finish(event, "failed")

    def _finish(self, event, status):
        if not db_timing_enabled():
            return
        with self._lock:
            started = self._starts.pop(event.request_id, None)
        duration_ms = (time.perf_counter() - started) * 1000 if started is not None else event.duration / 1000
        # Only operation metadata is logged. Query documents, parameters, URIs,
        # and database-specific identifiers are intentionally omitted.
        logger.info(
            "db_operation=%s status=%s duration_ms=%.2f",
            event.command_name,
            status,
            duration_ms,
        )
