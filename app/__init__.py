# -*- coding: utf-8 -*-
"""
Inicializácia Flask aplikácie
"""
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Konfigurácia
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, '..', 'expenses.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = 'dev-secret-key-change-in-production'
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    # Pri vývoji zníži šanca „starého“ JS/CSS v prehliadači (po zmene asset_ver v šablónach stačí refresh).
    app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
    
    db.init_app(app)
    
    with app.app_context():
        # Import modelov
        from app.models import Category, Expense, Income
        
        # Registrácia blueprintov
        from app.routes import main_bp, api_bp
        app.register_blueprint(main_bp)
        app.register_blueprint(api_bp, url_prefix='/api')
        
        db.create_all()
        _ensure_sqlite_category_area_column(app)

    @app.after_request
    def add_no_cache_headers(response):
        """Bráni prehliadaču držať staré HTML/JS/CSS pri lokálnom vývoji."""
        if response.mimetype == 'text/html' or request.path.startswith('/static/'):
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        return response
    
    return app


def _ensure_sqlite_category_area_column(app):
    """Pre existujúce SQLite DB pridá stĺpec category.area, ak chýba."""
    from sqlalchemy import inspect, text

    uri = app.config.get('SQLALCHEMY_DATABASE_URI') or ''
    if not uri.startswith('sqlite'):
        return
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    if 'category' not in tables:
        return
    columns = {col['name'] for col in inspector.get_columns('category')}
    if 'area' in columns:
        return
    with db.engine.begin() as conn:
        conn.execute(text('ALTER TABLE category ADD COLUMN area VARCHAR(80)'))
