# Vývojárske Požiadavky

```bash
pip install -r requirements-dev.txt
```

## Balíčky

### Testing
- pytest==7.4.0
- pytest-cov==4.1.0

### Code Quality
- flake8==6.1.0
- black==23.10.0
- isort==5.12.0
- mypy==1.6.0

### Documentation
- sphinx==7.2.6
- sphinx-rtd-theme==1.3.0

### Development
- python-dotenv==1.0.0
- ipython==8.15.0

## Spustenie Testov

```bash
pytest
pytest --cov=app
```

## Linting a Formatting

```bash
# Code style
black app/

# Import sorting
isort app/

# Linting
flake8 app/

# Type checking
mypy app/
```

## Building Dokumentácie

```bash
cd docs/
make html
```

## Pre-commit Hooks

Nainštaluj pre-commit:

```bash
pip install pre-commit
pre-commit install
```

---

Posledná aktualizácia: 5. november 2025
