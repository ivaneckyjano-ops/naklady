#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Spustenie aplikácie
"""
from app import create_app, db
from app.models import Category, Expense

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Category': Category, 'Expense': Expense}

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    # Listen on all interfaces so mobile devices on the same LAN can connect
        # Listen on all interfaces on a free port (5004) so mobile devices on the same LAN can connect
        app.run(debug=True, host='0.0.0.0', port=5004)
