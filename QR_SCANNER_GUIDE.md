# QR Skener a Prehľad Obchodov - Návod

## 🎉 Čo je nové?

Expense-tracker teraz podporuje:
- ✅ **QR skener** - naskenuj bločku a automaticky načítaj údaje
- ✅ **Sledovanie obchodov** - vidíš kde a koľko utratíš
- ✅ **Prehľad obchodov** - štatistika za každý obchod

---

## 📱 Ako používať QR skener?

### 1. Formát QR kódu

QR kód musí obsahovať údaje v tomto formáte:
```
suma|obchod|kategoria_id
```

**Príklady:**
```
50.50|LIDL|5
25.00|KAUFLAND|6
100.00|TESCO|8
```

**Popis:**
- **suma**: Cena nákupu v EUR (napr. 50.50)
- **obchod**: Názov obchodu VEĽKÝMI PÍSMENAMI (napr. LIDL, KAUFLAND, TESCO)
- **kategoria_id**: ID kategórie z databázy (voliteľné)

### 2. Ako vytvoriť QR kód?

Můžeš použiť online generátor:
- [qr-code-generator.com](https://www.qr-code-generator.com/)
- [goqr.me](https://goqr.me/)

Vložíš text vo formáte vyššie a vygeneruješ QR kód. Potom ho vytlačíš a napíšeš si ho na bločky.

### 3. Používanie skenera

1. Otvor aplikáciu → **QR Skener**
2. Klikni na **🎥 Spustiť skener**
3. Naskenuj QR kód z bločky
4. Údaje sa automaticky naplnia:
   - ✓ Suma
   - ✓ Obchod
   - ✓ Kategória
5. (Voliteľne) Pridaj popis
6. Klikni **✅ Uložiť výdavok**

### Upload z galérie (ak nechceš používať kameru)

1. Otvor aplikáciu na mobile (`http://<IP_POČÍTAČA>:5004/qr-scanner`). Pozri nižšie ako zistiť IP počítača.
2. Pod tlačidlami kamery nájdeš možnosť **Nahraj fotku bločku z galérie** — vyber fotografiu bločku z mobilu.
3. Aplikácia obrázok automaticky pošle na server, dekóduje QR kód a vyplní polia (suma, obchod, kategória ak je v kóde).
4. Skontroluj vyplnené údaje a klikni **✅ Uložiť výdavok**.

Tip: ak mobil otvorí stránku ako `localhost`, namiesto toho použite IP adresu počítača v lokálnej sieti (príkaz na PC: `hostname -I | awk '{print $1}'`).

---

## 📊 Prehľad Obchodov

Nová stránka **Prehľad Obchodov** ti ukazuje:

- **Počet obchodov** - koľko obchodov máš
- **Celkové výdavky** - spolu za všetky obchody
- **Počet transakcií** - koľko nákupov
- **Priemerný nákup** - priemer na nákup

### Detaily obchodu

Klikni na ľubovoľný obchod a vidíš:
- Všetky nákupy v tomto obchode
- Dátumy a sumy
- Kategórie

---

## 🗄️ Technické detaily

### Nové databázové pole

Do modelu `Expense` bolo pridané pole `store`:
```python
store = db.Column(db.String(100))  # Názov obchodu
```

Migrácia bola spustená automaticky cez `add_store_column.py`.

### Nové API endpointy

#### QR Dekódovanie
```
POST /api/qr/decode
Content-Type: application/json

{
  "image": "data:image/png;base64,..."
}

Response:
{
  "amount": 50.50,
  "store": "LIDL",
  "category_id": 5
}
```

#### Zoznam obchodov
```
GET /api/stores

Response:
[
  {
    "store": "LIDL",
    "count": 15,
    "total": 750.50,
    "average": 50.03
  },
  ...
]
```

#### Výdavky konkrétneho obchodu
```
GET /api/stores/LIDL/expenses

Response:
[
  {
    "id": 1,
    "amount": 50.50,
    "store": "LIDL",
    "category": "POTRAVINY",
    "date": "2025-12-11",
    ...
  },
  ...
]
```

---

## 🚀 Inštalácia (ak potrebuješ znovu)

```bash
cd ~/Aplikácie/expense-tracker

# Aktivuj virtual environment
source venv/bin/activate

# Nainštaluj nové knižnice
pip install -r requirements.txt

# Spusti migráciu (ak nemáš pole store)
python add_store_column.py

# Spusti aplikáciu
python run.py
```

---

## 🔧 Ladenie chýb

### "Chyba pri prístupe ku kamera"
- Skontroluj, či prehliadač má povolenie na prístup ku kamera
- Skúš použiť Firefox namiesto Chrome (lepšia podpora)
- Skúš na inom zariadení

### "Žiadny QR kód nenájdený"
- Svetlo musí byť dostatočné
- QR kód musí byť jasný a čitateľný
- Skúš pomalejšie pohybovať s kamerou

### "Chyba pri dekódovaní QR"
- Skontroluj formát: `suma|obchod|kategoria_id`
- Suma musí byť číslo s bodkou ako desatinný oddeľovač
- Obchod musí obsahovať iba písmená a čísla

---

## 📝 Príklady

### Príklad 1: Jednoduchý nákup

**QR kód:** `25.99|LIDL`

Vyplní:
- Suma: 25.99€
- Obchod: LIDL
- Kategória: (prázdna - vyberieš manuálne)

### Príklad 2: Nákup s kategóriou

**QR kód:** `50.50|KAUFLAND|3`

Vyplní:
- Suma: 50.50€
- Obchod: KAUFLAND
- Kategória: ID 3 (POTRAVINY)

---

## ❓ Otázky?

Ak niečo nefunguje, daj vedieť! Môžeme upraviť formát, pridať ďalšie polia, alebo zmeniť niečo iné.

Vďaka a vieľa úspechov s trackingom výdavkov! 🎉
