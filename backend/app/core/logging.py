import logging
import sys

class ImmediateFlushStreamHandler(logging.StreamHandler):
    def emit(self, record):
        super().emit(record)
        self.flush()

def setup_logging():
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(line_buffering=True)
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(line_buffering=True)
    except Exception:
        pass

    handler = ImmediateFlushStreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))

    logging.basicConfig(
        level=logging.INFO,
        handlers=[handler],
        force=True
    )
    
    app_logger = logging.getLogger("cretivra")
    app_logger.setLevel(logging.INFO)
    return app_logger

logger = setup_logging()

