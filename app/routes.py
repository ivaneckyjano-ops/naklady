# -*- coding: utf-8 -*-
"""
Trasy aplikácie (routes)
"""
from flask import Blueprint, render_template, request, jsonify
from app import db
from app.models import Category, Expense
from datetime import datetime, timedelta
from sqlalchemy import func, extract
import json

main_bp = Blueprint('main', __name__)
api_bp = Blueprint('api', __name__)

# ==================== FRONTEND ROUTES ====================

@main_bp.route('/')
def index():
    """Hlavná stránka"""
    return render_template('index.html')

@main_bp.route('/qr-scanner')
def qr_scanner():
    """Stránka QR skenera"""
    return render_template('qr_scanner.html')

@main_bp.route('/stores')
def stores():
    """Prehľad obchodov"""
    return render_template('stores.html')

@main_bp.route('/statistics')
def statistics():
    """Stránka štatistiky"""
    return render_template('statistics.html')

@main_bp.route('/comparison')
def comparison():
    """Stránka porovnania"""
    return render_template('comparison.html')

# ==================== API ROUTES ====================

# ----- KATEGÓRIE -----

@api_bp.route('/categories', methods=['GET'])
def get_categories():
    """Získaj všetky kategórie (vrátane podkategórií)"""
    # Vrátí len hlavné kategórie s ich podkategóriami (hierarchia)
    main_categories = Category.query.filter_by(parent_id=None).all()
    return jsonify([cat.to_dict(include_subcategories=True) for cat in main_categories])

@api_bp.route('/categories/flat', methods=['GET'])
def get_categories_flat():
    """Získaj všetky kategórie ako plochý zoznam (vrátane podkategórií)"""
    categories = Category.query.all()
    return jsonify([cat.to_dict() for cat in categories])

@api_bp.route('/categories', methods=['POST'])
def create_category():
    """Vytvor novú kategóriu alebo podkategóriu"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Chýba názov kategórie'}), 400
    
    parent_id = data.get('parent_id')  # None = hlavná kategória
    
    # Skontroluj, či kategória s týmto názvom a parent_id už existuje
    existing = Category.query.filter_by(name=data['name'], parent_id=parent_id).first()
    if existing:
        return jsonify({'error': 'Kategória s týmto názvom už existuje'}), 400
    
    # Ak je parent_id, skontroluj, že rodičovská kategória existuje
    if parent_id:
        parent = Category.query.get(parent_id)
        if not parent:
            return jsonify({'error': 'Rodičovská kategória neexistuje'}), 404
        # Rodič nesmie byť podkategória (len 1 úroveň hlbokosti)
        if parent.parent_id is not None:
            return jsonify({'error': 'Nie je možné vytvoriť podkategóriu podkategórie'}), 400
    
    category = Category(
        name=data['name'],
        icon=data.get('icon', '📦'),
        description=data.get('description', ''),
        parent_id=parent_id
    )
    db.session.add(category)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201

@api_bp.route('/categories/<int:id>', methods=['PUT'])
def update_category(id):
    """Uprav kategóriu"""
    category = Category.query.get_or_404(id)
    data = request.get_json()
    
    if 'name' in data:
        category.name = data['name']
    if 'icon' in data:
        category.icon = data['icon']
    if 'description' in data:
        category.description = data['description']
    
    db.session.commit()
    return jsonify(category.to_dict())

@api_bp.route('/categories/<int:id>', methods=['DELETE'])
def delete_category(id):
    """Vymaž kategóriu"""
    category = Category.query.get_or_404(id)
    db.session.delete(category)
    db.session.commit()
    return '', 204

# ----- VÝDAVKY -----

@api_bp.route('/expenses', methods=['GET'])
def get_expenses():
    """Získaj výdavky s filtrovacou možnosťou"""
    category_id = request.args.get('category_id', type=int)
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    query = Expense.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    if year:
        query = query.filter(extract('year', Expense.date) == year)
    
    if month:
        query = query.filter(extract('month', Expense.date) == month)
    
    expenses = query.order_by(Expense.date.desc()).all()
    return jsonify([exp.to_dict() for exp in expenses])

@api_bp.route('/expenses', methods=['POST'])
def create_expense():
    """Vytvor nový výdavok"""
    data = request.get_json()
    
    if not data or not data.get('category_id') or not data.get('amount'):
        return jsonify({'error': 'Chýbajúce povinné polia'}), 400
    
    # Skontroluj, či kategória existuje
    category = Category.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Kategória neexistuje'}), 404
    
    expense_date = data.get('date')
    if expense_date:
        expense_date = datetime.fromisoformat(expense_date).date()
    else:
        expense_date = datetime.utcnow().date()
    
    expense = Expense(
        category_id=data['category_id'],
        amount=float(data['amount']),
        description=data.get('description', ''),
        store=data.get('store', ''),  # Obchod z QR kódu alebo formulára
        date=expense_date
    )
    db.session.add(expense)
    db.session.commit()
    
    return jsonify(expense.to_dict()), 201

@api_bp.route('/expenses/<int:id>', methods=['PUT'])
def update_expense(id):
    """Uprav výdavok"""
    expense = Expense.query.get_or_404(id)
    data = request.get_json()
    
    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Kategória neexistuje'}), 404
        expense.category_id = data['category_id']
    
    if 'amount' in data:
        expense.amount = float(data['amount'])
    
    if 'description' in data:
        expense.description = data['description']
    
    if 'store' in data:
        expense.store = data['store']
    
    if 'date' in data:
        expense.date = datetime.fromisoformat(data['date']).date()
    
    db.session.commit()
    return jsonify(expense.to_dict())

@api_bp.route('/expenses/<int:id>', methods=['DELETE'])
def delete_expense(id):
    """Vymaž výdavok"""
    expense = Expense.query.get_or_404(id)
    db.session.delete(expense)
    db.session.commit()
    return '', 204

# ----- ŠTATISTIKA -----

@api_bp.route('/stats/summary', methods=['GET'])
def get_summary_stats():
    """Získaj zhrnutie štatistiky"""
    year = request.args.get('year', type=int)
    month = request.args.get('month', type=int)
    
    query = Expense.query
    
    if year:
        query = query.filter(extract('year', Expense.date) == year)
    
    if month:
        query = query.filter(extract('month', Expense.date) == month)
    
    total = db.session.query(func.sum(Expense.amount)).filter(Expense.query.filter(query.statement).whereclause).scalar() or 0
    
    expenses = query.all()
    
    # Súčet podľa kategórií
    by_category = {}
    for exp in expenses:
        cat_name = exp.category.name
        if cat_name not in by_category:
            by_category[cat_name] = {
                'total': 0,
                'icon': exp.category.icon,
                'count': 0
            }
        by_category[cat_name]['total'] += exp.amount
        by_category[cat_name]['count'] += 1
    
    # Súčet podľa mesiacov
    by_month = {}
    for exp in Expense.query.all():
        month_key = exp.date.strftime('%Y-%m')
        if month_key not in by_month:
            by_month[month_key] = 0
        by_month[month_key] += exp.amount
    
    return jsonify({
        'total': total,
        'by_category': by_category,
        'by_month': by_month,
        'expense_count': len(expenses)
    })

@api_bp.route('/stats/yearly', methods=['GET'])
def get_yearly_stats():
    """Získaj ročné štatistiky"""
    year = request.args.get('year', type=int, default=datetime.utcnow().year)
    
    # Mesačné súčty
    monthly_totals = {}
    for month in range(1, 13):
        total = db.session.query(func.sum(Expense.amount)).filter(
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).scalar() or 0
        monthly_totals[f'{month:02d}'] = total
    
    # Kategórie (vrátane podkategórií) v danom roku - vrátime aj parent_id pre každú kategóriu
    expenses = Expense.query.filter(extract('year', Expense.date) == year).all()
    by_subcategory = {}
    for exp in expenses:
        cat = exp.category
        cat_id = cat.id
        if cat_id not in by_subcategory:
            by_subcategory[cat_id] = {
                'id': cat_id,
                'name': cat.name,
                'parent_id': cat.parent_id,
                'icon': cat.icon,
                'total': 0
            }
        by_subcategory[cat_id]['total'] += exp.amount

    # Aggregate top-level categories (parents) by summing their own totals + subcategories
    by_category_top = {}
    for sub in by_subcategory.values():
        parent = sub['parent_id'] if sub['parent_id'] is not None else sub['id']
        parent_key = parent
        if parent_key not in by_category_top:
            # attempt to get parent info from DB
            parent_cat = Category.query.get(parent) if parent is not None else None
            by_category_top[parent_key] = {
                'id': parent_key,
                'name': parent_cat.name if parent_cat else sub['name'],
                'icon': parent_cat.icon if parent_cat else sub['icon'],
                'total': 0
            }
        by_category_top[parent_key]['total'] += sub['total']

    return jsonify({
        'year': year,
        'monthly_totals': monthly_totals,
        'by_category': by_category_top,      # top-level categories
        'by_subcategory': by_subcategory,    # individual categories including parent_id
        'total': sum(monthly_totals.values())
    })


@api_bp.route('/stats/monthly-category', methods=['GET'])
def get_monthly_category_stats():
    """Mesačný prehľad výdavkov podľa kategórií"""
    year = request.args.get('year', type=int)
    if not year:
        year = datetime.utcnow().year

    month_expr = extract('month', Expense.date)
    results = db.session.query(
        Category.id.label('category_id'),
        Category.name.label('category_name'),
        Category.icon.label('icon'),
        Category.parent_id.label('parent_id'),
        month_expr.label('month'),
        func.sum(Expense.amount).label('total')
    ).join(Category).filter(
        extract('year', Expense.date) == year
    ).group_by(Category.id, Category.name, Category.icon, Category.parent_id, month_expr).all()

    months = [f'{m:02d}' for m in range(1, 13)]
    monthly_totals = {month: 0 for month in months}
    categories = {}

    for row in results:
        month_key = f"{int(row.month):02d}"
        amount = float(row.total or 0)

        if row.category_id not in categories:
            categories[row.category_id] = {
                'id': row.category_id,
                'name': row.category_name,
                'parent_id': row.parent_id,
                'icon': row.icon,
                'monthly': {month: 0 for month in months},
                'total': 0
            }

        categories[row.category_id]['monthly'][month_key] = amount
        categories[row.category_id]['total'] += amount

        # Exclude the special category "Bločky bez kategorie" from the overall monthly totals (Spolu)
        # so that these receipts are visible as their own row but not counted twice in the summary row.
        if (row.category_name or '').strip().lower() != 'bločky bez kategorie':
            monthly_totals[month_key] += amount

    # Ensure parent (top-level) categories exist even if they have no direct expenses
    # (i.e., they only have expenses in subcategories). Aggregate subcategory sums into parents.
    for cat_id, cat in list(categories.items()):
        parent_id = cat.get('parent_id')
        if parent_id:
            # create parent entry if missing
            if parent_id not in categories:
                parent = Category.query.get(parent_id)
                categories[parent_id] = {
                    'id': parent.id,
                    'name': parent.name,
                    'parent_id': parent.parent_id,
                    'icon': parent.icon,
                    'monthly': {month: 0 for month in months},
                    'total': 0
                }
            # add this subcategory's amounts to parent totals
            for m in months:
                val = cat['monthly'].get(m, 0) or 0
                categories[parent_id]['monthly'][m] += val
                categories[parent_id]['total'] += val

    return jsonify({
        'year': year,
        'months': months,
        'categories': list(categories.values()),
        'monthly_totals': monthly_totals
    })

@api_bp.route('/stats/comparison', methods=['GET'])
def get_comparison_stats():
    """Porovnaj výdavky medzi rokmi/mesiacmi"""
    year1 = request.args.get('year1', type=int)
    year2 = request.args.get('year2', type=int)
    category_id = request.args.get('category_id', type=int)
    
    result = {}
    
    if year1:
        query = Expense.query.filter(extract('year', Expense.date) == year1)
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        monthly = {}
        for month in range(1, 13):
            total = db.session.query(func.sum(Expense.amount)).filter(
                extract('year', Expense.date) == year1,
                extract('month', Expense.date) == month
            )
            if category_id:
                total = total.filter(Expense.category_id == category_id)
            total = total.scalar() or 0
            monthly[f'{month:02d}'] = total
        
        result['year1'] = {
            'year': year1,
            'monthly': monthly,
            'total': sum(monthly.values())
        }
    
    if year2:
        query = Expense.query.filter(extract('year', Expense.date) == year2)
        if category_id:
            query = query.filter_by(category_id=category_id)
        
        monthly = {}
        for month in range(1, 13):
            total = db.session.query(func.sum(Expense.amount)).filter(
                extract('year', Expense.date) == year2,
                extract('month', Expense.date) == month
            )
            if category_id:
                total = total.filter(Expense.category_id == category_id)
            total = total.scalar() or 0
            monthly[f'{month:02d}'] = total
        
        result['year2'] = {
            'year': year2,
            'monthly': monthly,
            'total': sum(monthly.values())
        }
    
    return jsonify(result)

# ----- INICIALIZÁCIA -----

@api_bp.route('/init', methods=['POST'])
def initialize_data():
    """Inicializuj aplikáciu s ukážkovými dátami"""
    # Skontroluj, či už existujú dáta
    if Category.query.first():
        return jsonify({'error': 'Aplikácia je už inicializovaná'}), 400
    
    # Vytvor hlavné kategórie a podkategórie
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
    
    return jsonify({'message': 'Aplikácia bola úspešne inicializovaná s podkategóriami'}), 201

# ----- QR SKENER -----

@api_bp.route('/qr/decode', methods=['POST'])
def decode_qr():
    """
    Dekóduj QR kód zo základnej64 obrázka
    Formát v QR kóde: 'suma|obchod|kategoria_id' alebo len 'suma|obchod'
    Príklad: '50.50|LIDL|5' alebo '50.50|KAUFLAND'
    """
    from pyzbar.pyzbar import decode
    from PIL import Image
    import base64
    import io
    
    data = request.get_json()
    
    if not data or not data.get('image'):
        return jsonify({'error': 'Chýba obrázok'}), 400
    
    try:
        # Dekóduj obrázok z base64
        image_data = base64.b64decode(data['image'].split(',')[1])
        image = Image.open(io.BytesIO(image_data))
        
        # Čítaj QR kódy
        qr_codes = decode(image)
        
        if not qr_codes:
            return jsonify({'error': 'Žiadny QR kód nenájdený'}), 400
        
        # Spracuj prvý QR kód
        qr_data = qr_codes[0].data.decode('utf-8')
        parts = qr_data.split('|')
        
        result = {}
        
        # Parsuj QR dáta
        if len(parts) >= 1:
            result['amount'] = float(parts[0])
        
        if len(parts) >= 2:
            result['store'] = parts[1].strip().upper()
        
        if len(parts) >= 3:
            try:
                result['category_id'] = int(parts[2])
            except ValueError:
                pass
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': f'Chyba pri dekódovaní: {str(e)}'}), 400

# ----- PREHĽAD OBCHODOV -----

@api_bp.route('/stores', methods=['GET'])
def get_stores():
    """Získaj prehľad všetkých obchodov so štatistikou"""
    from sqlalchemy import func
    
    # Zoskupí výdavky podľa obchodu
    stores_data = db.session.query(
        Expense.store,
        func.count(Expense.id).label('count'),
        func.sum(Expense.amount).label('total')
    ).filter(
        Expense.store.isnot(None),
        Expense.store != ''
    ).group_by(
        Expense.store
    ).order_by(
        func.sum(Expense.amount).desc()
    ).all()
    
    result = []
    for store, count, total in stores_data:
        result.append({
            'store': store,
            'count': count,
            'total': float(total) if total else 0,
            'average': float(total) / count if total and count else 0
        })
    
    return jsonify(result), 200

@api_bp.route('/stores/<store_name>/expenses', methods=['GET'])
def get_store_expenses(store_name):
    """Získaj všetky výdavky pre konkrétny obchod"""
    expenses = Expense.query.filter_by(store=store_name.upper()).order_by(Expense.date.desc()).all()
    return jsonify([exp.to_dict() for exp in expenses])
