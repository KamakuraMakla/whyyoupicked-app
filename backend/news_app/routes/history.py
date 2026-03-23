from flask import Blueprint, jsonify, request

from ..db import get_db_connection, utc_now_iso
from ..services.auth_service import verify_token


history_bp = Blueprint("history", __name__)


def _get_user_id() -> int | None:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return verify_token(auth[7:])
    return None


@history_bp.post("/api/history/view")
def save_view_history():
    payload = request.get_json(silent=True) or {}

    article_id = payload.get("articleId")
    if not article_id:
        return jsonify({"error": "articleId is required"}), 400

    viewed_at = utc_now_iso()

    conn = get_db_connection()
    user_id = _get_user_id()
    conn.execute(
        """
        INSERT INTO view_history (article_id, title, source, category, published_at, url, query, viewed_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            article_id,
            payload.get("title"),
            payload.get("source"),
            payload.get("category"),
            payload.get("publishedAt"),
            payload.get("url"),
            payload.get("query"),
            viewed_at,
            user_id,
        ),
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True, "savedAt": viewed_at})


@history_bp.post("/api/history/reflection")
def save_reflection():
    payload = request.get_json(silent=True) or {}

    article_id = payload.get("articleId")
    trigger = payload.get("trigger")
    mood = payload.get("mood")
    if not article_id or not trigger or not mood:
        return jsonify({"error": "articleId, trigger and mood are required"}), 400

    saved_at = utc_now_iso()

    conn = get_db_connection()
    user_id = _get_user_id()
    conn.execute(
        """
        INSERT INTO reflections (article_id, category, trigger, mood, note, query, saved_at, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            article_id,
            payload.get("category"),
            trigger,
            mood,
            payload.get("note"),
            payload.get("query"),
            saved_at,
            user_id,
        ),
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True, "savedAt": saved_at})


@history_bp.get("/api/history")
def get_history():
    limit_raw = request.args.get("limit", "50")
    try:
        limit = max(1, min(int(limit_raw), 200))
    except ValueError:
        limit = 50

    user_id = _get_user_id()
    conn = get_db_connection()
    if user_id:
        views = conn.execute(
            """
            SELECT article_id AS articleId, title, source, category, published_at AS publishedAt, url, query, viewed_at AS viewedAt
            FROM view_history
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
        reflections = conn.execute(
            """
            SELECT article_id AS articleId, category, trigger, mood, note, query, saved_at AS savedAt
            FROM reflections
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
    else:
        views = conn.execute(
            """
            SELECT article_id AS articleId, title, source, category, published_at AS publishedAt, url, query, viewed_at AS viewedAt
            FROM view_history
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
        reflections = conn.execute(
            """
            SELECT article_id AS articleId, category, trigger, mood, note, query, saved_at AS savedAt
            FROM reflections
            ORDER BY id DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    conn.close()

    return jsonify(
        {
            "viewHistory": [dict(row) for row in views],
            "reflections": [dict(row) for row in reflections],
        }
    )