# -*- coding: utf-8 -*-
"""
Inicializácia Flask aplikácie
"""
from flask import Flask
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
    
    db.init_app(app)
    
    with app.app_context():
        # Import modelov
        from app.models import Category, Expense
        
        # Registrácia blueprintov
        from app.routes import main_bp, api_bp
        app.register_blueprint(main_bp)
        app.register_blueprint(api_bp, url_prefix='/api')
        
        db.create_all()
    
    return app
