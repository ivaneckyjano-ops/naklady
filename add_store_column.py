#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skript na pridanie poľa 'store' do existujúcej databázy
"""
import os
import sys
from app import create_app, db
from sqlalchemy import text

app = create_app()

def add_store_column():
    """Prida stĺpec 'store' do tabuľky Expense"""
    with app.app_context():
        try:
            # Kontrola či stĺpec už existuje
            inspector = db.inspect(db.engine)
            columns = [col['name'] for col in inspector.get_columns('expense')]
            
            if 'store' in columns:
                print("✓ Stĺpec 'store' už existuje")
                return True
            
            # Pridaj stĺpec
            with db.engine.connect() as connection:
                connection.execute(text('ALTER TABLE expense ADD COLUMN store VARCHAR(100)'))
                connection.commit()
            
            print("✓ Stĺpec 'store' úspešne pridaný do tabuľky Expense")
            return True
            
        except Exception as e:
            print(f"✗ Chyba pri pridaní stĺpca: {e}")
            return False

if __name__ == '__main__':
    print("Pridávam stĺpec 'store' do databázy...")
    if add_store_column():
        print("\n✓ Migrácia úspešná!")
        sys.exit(0)
    else:
        print("\n✗ Migrácia zlyhala")
        sys.exit(1)
