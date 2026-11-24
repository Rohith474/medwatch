# Celery app is imported only when celery is available
try:
    from .celery import app as celery_app
    __all__ = ('celery_app',)
except ImportError:
    pass
