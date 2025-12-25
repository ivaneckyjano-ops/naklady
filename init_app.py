#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Inicializačný skript pre aplikáciu
"""
import sys
from app import create_app, db
from app.models import Category

app = create_app()

with app.app_context():
    try:
        print("🔄 Inicializácia aplikácie...")
        
        # Kontrola či je inicializovaná
        if Category.query.first():
            print("✓ Aplikácia je už inicializovaná")
            sys.exit(0)
        
        # Vytvor kategórie s podkategóriami
        categories_structure = {
            'Dom': {
                'icon': '🏠',
                'description': 'Výdavky na dom a údržbu',
                'subcategories': [
                    {'name': 'Opravy', 'icon': '🔧', 'description': 'Opravy domu'},
                    {'name': 'Údržba', 'icon': '🧹', 'description': 'Údržba domu'},
                    {'name': 'Pôdny rent', 'icon': '📄', 'description': 'Mesačný pôdny rent'}
                ]
            },
            'Auto': {
                'icon': '🚗',
                'description': 'Výdavky na auto',
                'subcategories': [
                    {'name': 'Parkovisko', 'icon': '🅿️', 'description': 'Mesačné parkovisko'},
                    {'name': 'Prístrešok', 'icon': '🏚️', 'description': 'Mesačný prístrešok'},
                    {'name': 'Opravy', 'icon': '🔧', 'description': 'Opravy auta'},
                    {'name': 'Palivo', 'icon': '⛽', 'description': 'Palivo'},
                    {'name': 'SPZ', 'icon': '📋', 'description': 'Poistenie a známka'},
                ]
            },
            'Záhrada': {
                'icon': '🌳',
                'description': 'Výdavky na záhradu',
                'subcategories': [
                    {'name': 'Rastliny', 'icon': '🌱', 'description': 'Nákup rastlín'},
                    {'name': 'Náradie', 'icon': '🛠️', 'description': 'Záhradné náradie'},
                    {'name': 'Hnojivo', 'icon': '🧪', 'description': 'Hnojivo a ošetrovateľ'}
                ]
            },
            'Potraviny': {
                'icon': '🛒',
                'description': 'Nákup potravín',
                'subcategories': []
            },
            'Elektrina': {
                'icon': '💡',
                'description': 'Mesačné faktúry za elektrinu',
                'subcategories': []
            },
            'Plyn': {
                'icon': '🔥',
                'description': 'Mesačné faktúry za plyn',
                'subcategories': []
            },
            'Voda': {
                'icon': '💧',
                'description': 'Mesačné faktúry za vodu',
                'subcategories': []
            },
            'Internet': {
                'icon': '📡',
                'description': 'Mesačný internet',
                'subcategories': []
            },
            'Ostatné': {
                'icon': '📦',
                'description': 'Ostatné výdavky',
                'subcategories': []
            }
        }
        
        # Vytvor kategórie
        for cat_name, cat_data in categories_structure.items():
            category = Category(
                name=cat_name,
                icon=cat_data['icon'],
                description=cat_data['description'],
                parent_id=None
            )
            db.session.add(category)
            db.session.flush()  # Získaj ID novej kategórie
            
            # Vytvor podkategórie
            for sub_data in cat_data.get('subcategories', []):
                subcategory = Category(
                    name=sub_data['name'],
                    icon=sub_data['icon'],
                    description=sub_data.get('description', ''),
                    parent_id=category.id
                )
                db.session.add(subcategory)
        
        db.session.commit()
        
        print("✅ Aplikácia bola úspešne inicializovaná!")
        print(f"   • Vytvorených {len(categories_structure)} hlavných kategórií")
        total_subcats = sum(len(cat['subcategories']) for cat in categories_structure.values())
        print(f"   • Vytvorených {total_subcats} podkategórií")
        print("   • Používaj podkategórie na detailnejšie sledovanie!")
                
    except Exception as e:
        print(f"❌ Chyba: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
