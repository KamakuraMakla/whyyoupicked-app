import requests
from flask import Blueprint, jsonify, request

from ..config import DEFAULT_QUERY
from ..services.news_service import fetch_newsapi_articles


news_bp = Blueprint("news", __name__)


@news_bp.get("/api/news")
def get_news():
    query = request.args.get("q", DEFAULT_QUERY).strip() or DEFAULT_QUERY

    try:
        articles = fetch_newsapi_articles(query)
        return jsonify({"query": query, "count": len(articles), "articles": articles})
    except requests.RequestException as exc:
        return jsonify({"error": "Failed to reach the external news API.", "details": str(exc)}), 502
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        return jsonify({"error": "Unexpected server error.", "details": str(exc)}), 500