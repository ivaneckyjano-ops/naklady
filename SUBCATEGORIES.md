# Podkategórie - Sprievodca Používania

Verzia: **2.0.0** ✨

---

## ✨ Čo sú nového?

Aplikácia teraz podporuje **podkategórie** - detailnejšie špecifikácie nákladov!

### Príklady:

```
Dom (Hlavná kategória)
  ├─ Opravy
  ├─ Údržba
  └─ Pôdny rent

Auto (Hlavná kategória)
  ├─ Parkovisko
  ├─ Prístrešok
  ├─ Opravy
  ├─ Palivo
  └─ SPZ

Záhrada (Hlavná kategória)
  ├─ Rastliny
  ├─ Náradie
  └─ Hnojivo
```

---

## 🎯 Ako Používať Podkategórie

### 1️⃣ Vstup Výdavku

**Starý Spôsob:**
- Vyberieš kategóriu (napr. "Auto")
- Zadáš výdavok

**Nový Spôsob:**
- Vyberieš **hlavnú kategóriu** (napr. "Auto")
- Aplikácia ti automaticky ukáže **dostupné podkategórie**
- Vyberieš podkategóriu (napr. "Parkovisko")
- Zadáš výdavok

**Výsledok:**
Výdavok sa zaznamená pod `Auto > Parkovisko` - presne vidíš čo je čo!

### 2️⃣ Zobrazenie Výdavkov

V zozname výdavkov vidíš štruktúru:

```
🚗 Auto
  🅿️ Parkovisko
  Platba za mesiac • 5.11.2025
  10.00 €
```

### 3️⃣ Štatistika Podľa Podkategórií

V štatistikách sú podkategórie automaticky zatriedené:

```
Dom (🏠)
  Opravy: 150€
  Údržba: 50€
  Pôdny rent: 200€
```

---

## ➕ Ako Pridať Novú Podkategóriu

### Metóda 1: Cez Formulár (Odporúčané)

1. **Klikni na "Pridaj Podkategóriu"** (v časti Kategórie)
2. **Vyber hlavnú kategóriu** (napr. "Auto")
3. **Zadaj názov** (napr. "Diaľničný známka")
4. **Vyber ikonu** (emoji, napr. 🛣️)
5. **Klikni "Vytvor Podkategóriu"**

**Hotovo!** Podkategória sa okamžite objaví v selecte.

### Metóda 2: Priamo Pri Vstupe

V selecte "Hlavná Kategória":
- Vyber hlavnú kategóriu
- Zobrazí sa select "Podkategória"
- Ak tam vidíš čo potrebuješ → vyber to
- Ak tam to nie je → ➕ pridaj novú cez "Pridaj Podkategóriu"

---

## 📊 Existujúce Podkategórie

### 🏠 Dom
- 🔧 Opravy
- 🧹 Údržba
- 📄 Pôdny rent

### 🚗 Auto
- 🅿️ Parkovisko
- 🏚️ Prístrešok
- 🔧 Opravy
- ⛽ Palivo
- 📋 SPZ (Poistenie a známka)

### 🌳 Záhrada
- 🌱 Rastliny
- 🛠️ Náradie
- 🧪 Hnojivo

### Ostatné (bez podkategórií)
- 🛒 Potraviny
- 💡 Elektrina
- 🔥 Plyn
- 💧 Voda
- 📡 Internet
- 📦 Ostatné

---

## ⚙️ Technické Detaily

### Databázová Štruktúra

```sql
Category
  ├─ id (primárny kľúč)
  ├─ name (názov)
  ├─ icon (emoji ikona)
  ├─ description (popis)
  ├─ parent_id (NULLABLE - NULL = hlavná kategória)
  └─ created_at (dátum vytvorenia)

Unique Constraint: (name, parent_id)
  -- Znamená: Rovnaký názov sa može opakovať pod rôznymi rodičmi
```

### API Endpoints

#### Získaj Kategórie s Hierarchiou
```bash
GET /api/categories
# Vrátí len hlavné kategórie s ich podkategóriami
```

#### Získaj Všetky Kategórie (Plochý Zoznam)
```bash
GET /api/categories/flat
# Vrátí všetky kategórie vrátane podkategórií ako plochý zoznam
```

#### Vytvor Novú Kategóriu (bez rodičovskej)
```bash
POST /api/categories
{
  "name": "Nová Kategória",
  "icon": "📦",
  "description": "Opis",
  "parent_id": null
}
```

#### Vytvor Novú Podkategóriu
```bash
POST /api/categories
{
  "name": "Parkovisko",
  "icon": "🅿️",
  "description": "Mesačné parkovisko",
  "parent_id": 2  # ID rodičovskej kategórie "Auto"
}
```

---

## 🐛 Obnovenie Pri Problémoch

### Ak aplikácia "pokazí" kategórie

```bash
# 1. Zatvori aplikáciu
cd /home/narbon/Aplikácie/expense-tracker

# 2. Zmaž staré dáta
rm -f expenses.db

# 3. Reinicializuj
python init_app.py

# 4. Spusti aplikáciu
naklady
```

### Čo sa stane
- ✅ Všetky kategórie a podkategórie sa obnoví
- ✅ Všetky staré výdavky sa stracia (zálohuj si ich!)
- ✅ Aplikácia je čistá a hotová

---

## 💡 Tips & Tricks

### 1. Hromadné Podkategórie
Ak chceš vytvoriť viac podkategórií na raz, použi "Pridaj Podkategóriu" viackrát:
```
1. Pridaj "Diaľničný známka"
2. Pridaj "Technická kontrola"
3. Pridaj "Registrácia"
```

### 2. Rovnaké Mená Podkategórií
Vrátane sa ti mať rovnaký názov pod rôznymi kategóriami:
```
Dom > Opravy
Auto > Opravy  ✓ OK! (Sú to rôzne veci)
```

### 3. Bez Podkategórie
Ak konkrétna kategória nemá podkategórie, selecte "Podkategória" sa skrýje.

### 4. Zmena Kategórie
Teraz vidíš aj hierarchiu pri zmenách:
```
🚗 Auto
  🅿️ Parkovisko (20€)
  ⛽ Palivo (50€)
  🔧 Opravy (150€)
```

---

## 🎓 Migrácia zo Starej Verzie

Ak si mal starú verziu bez podkategórií:

1. **Tvoje staré kategórie** sa zachovajú ako **hlavné kategórie**
2. **Tvoje staré výdavky** zostanú priradené k hlavným kategóriám
3. **Môžeš pridávať podkategórie** bez toho, aby si stratil staré dáta

### Príklad
```
Stará DB:          Nová DB:
Auto (50€)    →    Auto (50€)
  └─ Palivo        └─ [Bez podkategórie]

# Teraz môžeš pridať:
  └─ Parkovisko
  └─ Prístrešok
  └─ atď...
```

---

## ❓ FAQ

**O: Čo ak chcem zboru kategórií bez podkategórií?**
A: Nemáš problém! Môžeš ich nechať tak ako sú - výdavky bez podkategórií sa počítajú normálne.

**O: Mohu mazať podkategórie?**
A: ✅ Áno! Klikni "Vymaž" vedľa podkategórie. Výdavky ostanú, len sa prepoja na hlavnú kategóriu.

**O: Čo ak mám viac ako 2 úrovne hierarchie?**
A: V tejto verzii je maximálne 2 úrovne (hlavná + pod-). Nie je možné robiť "sub-podkategórie".

**O: Ako sú podkategórie viditeľné v štatistikách?**
A: V štatistikách sa podkategórie automaticky agregujú podľa hlavnej kategórie.

**O: Čo ak mám teraz výdavok bez podkategórie?**
A: Je to OK! Počítá sa normálne a vidíš ho ako výdavok hlavnej kategórie.

---

## 📚 Ďalšie Zdroje

- [README.md](README.md) - Hlavná dokumentácia
- [USAGE.md](USAGE.md) - Sprievodca používaním
- [CONFIG.md](CONFIG.md) - Konfigurácia aplikácie

---

## 🎉 Viac Detailov Chceš?

Podkategórie sú teraz **plne funkčné**!

- ✅ Vytváraš ich cez UI
- ✅ Vidíš ich v zozname výdavkov
- ✅ Filtruje sa automaticky
- ✅ Štatistiky sú podľa hierarchie

**Enjoy! 🚀**

---

*Dokumentácia pre Sledovanie Nákladov v.2.0*
*Dátum: 5. november 2025*
