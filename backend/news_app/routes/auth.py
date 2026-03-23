from datetime import datetime, timezone

from flask import Blueprint, jsonify, request

from ..db import get_db_connection, utc_now_iso
from ..services.auth_service import create_token, hash_password, verify_password, verify_token

auth_bp = Blueprint("auth", __name__)


def get_user_id_from_request() -> int | None:
    """Extract and validate the Bearer token, returning user_id or None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return verify_token(auth_header[7:])


@auth_bp.post("/api/auth/register")
def register():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return jsonify({"error": "ユーザー名とパスワードは必須です"}), 400
    if len(username) < 2:
        return jsonify({"error": "ユーザー名は2文字以上で入力してください"}), 400
    if len(password) < 6:
        return jsonify({"error": "パスワードは6文字以上で入力してください"}), 400

    conn = get_db_connection()
    try:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ?", (username,)
        ).fetchone()
        if existing:
            return jsonify({"error": "このユーザー名は既に使用されています"}), 409

        conn.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            (username, hash_password(password), utc_now_iso()),
        )
        conn.commit()
        user_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    finally:
        conn.close()

    token = create_token(user_id)
    return jsonify({"token": token, "username": username}), 201


@auth_bp.post("/api/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""

    if not username or not password:
        return jsonify({"error": "ユーザー名とパスワードを入力してください"}), 400

    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT id, password_hash FROM users WHERE username = ?", (username,)
        ).fetchone()
    finally:
        conn.close()

    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "ユーザー名またはパスワードが正しくありません"}), 401

    token = create_token(user["id"])
    return jsonify({"token": token, "username": username}), 200


@auth_bp.get("/api/auth/me")
def me():
    user_id = get_user_id_from_request()
    if not user_id:
        return jsonify({"error": "認証が必要です"}), 401

    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT id, username, created_at FROM users WHERE id = ?", (user_id,)
        ).fetchone()
    finally:
        conn.close()

    if not user:
        return jsonify({"error": "ユーザーが見つかりません"}), 404

    return jsonify({"id": user["id"], "username": user["username"]}), 200
