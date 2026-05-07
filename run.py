#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Spustenie aplikácie
"""
from app import create_app, db
from app.models import Category, Expense, Income

app = create_app()

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'Category': Category, 'Expense': Expense, 'Income': Income}

if __name__ == '__main__':
    import threading
    import webbrowser
    import time
    def open_browser():
        # Počkej, než server naběhne
        time.sleep(1)
        webbrowser.get('firefox').open('http://localhost:5004')

    threading.Thread(target=open_browser).start()
    with app.app_context():
        db.create_all()
        app.run(debug=True, host='0.0.0.0', port=5004)
