import sqlite3
from datetime import datetime, timezone

from .config import DB_PATH


def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS view_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id TEXT NOT NULL,
            title TEXT,
            source TEXT,
            category TEXT,
            published_at TEXT,
            url TEXT,
            query TEXT,
            viewed_at TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id TEXT NOT NULL,
            category TEXT,
            trigger TEXT,
            mood TEXT,
            note TEXT,
            query TEXT,
            saved_at TEXT NOT NULL
        )
        """
    )

    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    # Migration: add user_id to existing tables if not present
    for table in ("view_history", "reflections"):
        try:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN user_id INTEGER REFERENCES users(id)")
        except Exception:
            pass  # column already exists

    conn.commit()
    conn.close()