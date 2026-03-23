from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from .db import init_db
from .routes.auth import auth_bp
from .routes.history import history_bp
from .routes.news import news_bp


def create_app():
    load_dotenv()

    app = Flask(__name__)
    CORS(app)

    init_db()
    app.register_blueprint(auth_bp)
    app.register_blueprint(news_bp)
    app.register_blueprint(history_bp)

    return app