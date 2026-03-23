import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "newsapp.db"

NEWS_API_URL = "https://newsapi.org/v2/everything"
DEFAULT_QUERY = "technology"
PAGE_SIZE = 12

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")