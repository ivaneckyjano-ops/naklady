#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Skript na migráciu databázy zo starej štruktúry na novú so podkategóriami
"""
import os
import sys
from app import create_app, db
from app.models import Category, Expense
from sqlalchemy import text

app = create_app()

def backup_old_db():
    """Zálohuj starú databázu"""
    old_db_path = 'instance/expenses.db'
    backup_path = 'instance/expenses.db.backup'
    
    if os.path.exists(old_db_path):
        import shutil
        shutil.copy(old_db_path, backup_path)
        print(f"✓ Zálohovaná stará databáza: {backup_path}")
        return True
    return False

def migrate_database():
    """Migrácia databázy"""
    with app.app_context():
        try:
            # Kontrola či existuje stará databáza
            old_db_path = 'instance/expenses.db'
            if not os.path.exists(old_db_path):
                print("⚠ Stará databáza nenájdená, vytvára sa nová...")
                db.create_all()
                print("✓ Nová databáza vytvára")
                return True
            
            # Zálohuj starú DB
            backup_old_db()
            
            # Skontroluj existujúce tabuľky
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            if 'category' not in tables or 'expense' not in tables:
                print("⚠ Staré tabuľky nenájdené, vytvára sa nová databáza...")
                db.create_all()
                print("✓ Nová databáza vytvorená")
                return True
            
            # Zistí či má category tabuľka parent_id
            columns = [col['name'] for col in inspector.get_columns('category')]
            if 'parent_id' in columns:
                print("✓ Databáza je už migrovaná (parent_id stĺpec existuje)")
                return True
            
            print("🔄 Migrácia databázy...")
            
            # 1. Záloha starej kategorie
            old_categories = db.session.execute(
                text('SELECT id, name, icon, description, created_at FROM category')
            ).fetchall()
            
            # 2. Záloha starých výdavkov
            old_expenses = db.session.execute(
                text('SELECT id, category_id, amount, description, date, created_at FROM expense')
            ).fetchall()
            
            print(f"✓ Zálohované: {len(old_categories)} kategórií, {len(old_expenses)} výdavkov")
            
            # 3. Vymaž staré tabuľky
            db.session.execute(text('DROP TABLE IF EXISTS expense'))
            db.session.execute(text('DROP TABLE IF EXISTS category'))
            db.session.commit()
            print("✓ Staré tabuľky zmazané")
            
            # 4. Vytvor nové tabuľky
            db.create_all()
            print("✓ Nové tabuľky vytvorené so podporou podkategórií")
            
            # 5. Obnov staré kategórie ako hlavné kategórie (bez parent_id)
            for cat_id, name, icon, description, created_at in old_categories:
                new_cat = Category(
                    id=cat_id,
                    name=name,
                    icon=icon,
                    description=description,
                    parent_id=None,
                    created_at=created_at
                )
                db.session.add(new_cat)
            
            db.session.commit()
            print(f"✓ Obnovené {len(old_categories)} kategórií (ako hlavné kategórie)")
            
            # 6. Obnov staré výdavky
            for exp_id, cat_id, amount, description, date, created_at in old_expenses:
                new_exp = Expense(
                    id=exp_id,
                    category_id=cat_id,
                    amount=amount,
                    description=description,
                    date=date,
                    created_at=created_at
                )
                db.session.add(new_exp)
            
            db.session.commit()
            print(f"✓ Obnovené {len(old_expenses)} výdavkov")
            
            print("\n✅ Migrácia úspešne dokončená!")
            print(f"   Záloha starej DB: instance/expenses.db.backup")
            print(f"   Teraz môžete pridávať podkategórie!")
            return True
            
        except Exception as e:
            print(f"❌ Chyba pri migrácii: {e}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    success = migrate_database()
    sys.exit(0 if success else 1)
