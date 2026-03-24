import hashlib
import os
import random
from collections import defaultdict, deque

import requests

from ..config import NEWS_API_URL, PAGE_SIZE


def infer_category(title, description, query):
    # Use only article content for categorization to avoid query-driven bias.
    text = " ".join(filter(None, [title, description])).lower()

    category_keywords = {
        "technology": ["ai", "software", "tech", "startup", "app", "device", "robot"],
        "business": ["market", "stock", "economy", "business", "company", "finance"],
        "science": ["research", "science", "space", "climate", "study", "medical"],
        "politics": ["election", "government", "policy", "minister", "politics"],
        "sports": ["sports", "match", "league", "team", "player", "tournament"],
        "culture": ["movie", "music", "art", "fashion", "culture", "design"],
    }

    for category, keywords in category_keywords.items():
        if any(keyword in text for keyword in keywords):
            return category

    return "general"


def calculate_popularity(title, source, published_at):
    from datetime import datetime, timezone

    score = 45
    known_sources = {
        "bbc news": 18,
        "reuters": 20,
        "the verge": 14,
        "techcrunch": 16,
        "associated press": 18,
    }

    source_bonus = known_sources.get((source or "").lower(), 8)
    score += source_bonus

    if title:
        score += min(len(title) // 12, 12)

    try:
        published_dt = datetime.fromisoformat((published_at or "").replace("Z", "+00:00"))
        hours_old = max((datetime.now(timezone.utc) - published_dt).total_seconds() / 3600, 0)
        freshness_bonus = max(0, 25 - int(hours_old))
        score += freshness_bonus
    except ValueError:
        score += 5

    return min(score, 100)


def normalize_article(article, query):
    title = article.get("title") or "No title"
    description = article.get("description") or "要約はありません。"
    source = (article.get("source") or {}).get("name") or "Unknown source"
    published_at = article.get("publishedAt") or ""
    url = article.get("url") or ""
    image_url = article.get("urlToImage") or ""

    article_id_source = f"{url}|{title}|{published_at}"
    article_id = hashlib.md5(article_id_source.encode("utf-8")).hexdigest()[:12]

    return {
        "id": article_id,
        "title": title,
        "source": source,
        "publishedAt": published_at,
        "url": url,
        "imageUrl": image_url,
        "description": description,
        "category": infer_category(title, description, query),
        "popularity": calculate_popularity(title, source, published_at),
    }


def request_newsapi(query, language, page_size):
    api_key = os.getenv("NEWS_API_KEY")
    if not api_key:
        raise RuntimeError("NEWS_API_KEY is not set in .env")

    params = {
        "q": query,
        "apiKey": api_key,
        "language": language,
        "pageSize": page_size,
        "sortBy": "publishedAt",
    }

    response = requests.get(NEWS_API_URL, params=params, timeout=10)
    response.raise_for_status()
    payload = response.json()

    if payload.get("status") != "ok":
        raise RuntimeError(payload.get("message") or "News API request failed")

    return payload.get("articles", [])


def fetch_newsapi_articles(query):
    # Request extra articles in Japanese to have a good pool for shuffling
    fetch_size = min(PAGE_SIZE * 3, 100)
    raw_articles = request_newsapi(query, "ja", fetch_size)

    # Only supplement with English if virtually no Japanese articles exist
    if len(raw_articles) < 3:
        raw_articles.extend(request_newsapi(query, "en", fetch_size - len(raw_articles)))

    normalized_articles = []
    seen_urls = set()

    for article in raw_articles:
        url = article.get("url")
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        normalized_articles.append(normalize_article(article, query))

    # Shuffle first to keep each category list fresh across requests.
    random.shuffle(normalized_articles)

    # Build a category-balanced list so one category does not dominate the first page.
    by_category = defaultdict(list)
    for article in normalized_articles:
        by_category[article["category"]].append(article)

    category_queues = deque()
    for category, items in by_category.items():
        random.shuffle(items)
        category_queues.append((category, deque(items)))

    balanced = []
    while category_queues and len(balanced) < PAGE_SIZE:
        category, items = category_queues.popleft()
        if items:
            balanced.append(items.popleft())
        if items:
            category_queues.append((category, items))

    return balanced