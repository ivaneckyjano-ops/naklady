# Konfigurácia Aplikácie

Táto stránka popisuje konfiguračné možnosti aplikácie.

## Konfiguračné Súbory

### `app/__init__.py`

Hlavný konfiguračný súbor aplikácie:

```python
# Cesta k databáze
SQLALCHEMY_DATABASE_URI = 'sqlite:///expenses.db'

# Tajný kľúč pre session
SECRET_KEY = 'dev-secret-key-change-in-production'

# Debug režim
DEBUG = True
```

## Prostredie

Pred spustením v produkcii, nastav tieto premenné prostredia:

```bash
# Produkčný režim
export FLASK_ENV=production
export FLASK_DEBUG=False

# Tajný kľúč
export SECRET_KEY=your-secret-key-here

# Databáza
export DATABASE_URL=postgresql://user:password@localhost/expenses
```

## Databáza

### SQLite (Štandardne)

Automaticky sa vytvorí v priečinku aplikácie ako `expenses.db`.

### PostgreSQL (Odporúčané na Produkcii)

1. Inštaluj PostgreSQL driver:
```bash
pip install psycopg2-binary
```

2. Nastav databázu v `app/__init__.py`:
```python
DATABASE_URL = 'postgresql://user:password@localhost:5432/expenses'
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
```

## Produkčná Konfigurácia

### 1. Zmena Tajného Kľúča

```python
# app/__init__.py
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'random-key-in-production')
```

### 2. Vypnutie Debugu

```python
app.config['DEBUG'] = False
```

### 3. Použitie Production WSGI Serveru

```bash
# Inštalácia Gunicornu
pip install gunicorn

# Spustenie
gunicorn -w 4 -b 0.0.0.0:5004 run:app
```

### 4. HTTPS

Použij reverse proxy (Nginx, Apache) na HTTPS.

## Customizácia

### Zmena Portov

V `run.py`:

```python
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
```

### Zmena Databázy

V `app/__init__.py`:

```python
# MySQL
DATABASE_URL = 'mysql://user:password@localhost/expenses'

# SQLite v inej lokácii
DATABASE_URL = 'sqlite:////absolute/path/to/expenses.db'
```

## Logy

Aplikácia vytvorí výstup v `stderr` a v Flask debuggeri.

Na produkciu konfigurácia logovania v `run.py`:

```python
import logging

logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s %(levelname)s: %(message)s'
)
```

## Bezpečnosť

### CORS (Cross-Origin Resource Sharing)

Ak API používa iný frontend:

```bash
pip install flask-cors
```

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
```

### CSRF Ochrana

```bash
pip install flask-wtf
```

```python
from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()
csrf.init_app(app)
```

---

Posledná aktualizácia: 5. november 2025
