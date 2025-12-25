# Pokyny na Používanie Aplikácie

## 1️⃣ Spustenie Aplikácie

Pozri `README.md` pre inštrukcie na spustenie.

## 2️⃣ Prvý Spustenie

Pri prvom spustení aplikácia automaticky vytvorí nasledovné kategórie:

- 🏠 **Dom** - Výdavky na dom a údržbu (maľovanie, opravy, atď.)
- 🚗 **Auto** - Výdavky na auto (palivo, údržba, poistenie)
- 🌳 **Záhrada** - Výdavky na záhradu (semená, nástrojov, atď.)
- 🛒 **Potraviny** - Nákup potravín
- 💡 **Elektrina** - Mesačné faktúry za elektrinu
- 🔥 **Plyn** - Mesačné faktúry za plyn
- 💧 **Voda** - Mesačné faktúry za vodu
- 📡 **Internet** - Mesačný internet
- 📦 **Ostatné** - Ostatné výdavky

## 3️⃣ Pridávanie Výdavkov

### Postup:

1. **Domovská stránka** - Klikni na "Domov" v menu
2. **Formulár** - Vyplň nasledovné polia:
   - **Kategória** - Vyber z rozbaľovacieho zoznamu
   - **Suma** - Zadaj čiastku v eurách (napr. `45.99`)
   - **Popis** - Pridaj popis (napr. "Elektrické vedenie")
   - **Dátum** - Vyber dátum výdavku
3. **Odoslanie** - Klikni na "Pridaj Výdavok"

### Príklady:

| Kategória | Suma | Popis | Dátum |
|-----------|------|-------|-------|
| Dom | 150.00 | Kúpenie farby | 2025-11-05 |
| Auto | 60.00 | Palivo | 2025-11-05 |
| Elektrina | 85.50 | Mesačná faktúra | 2025-11-01 |
| Potraviny | 45.30 | Nákup v Tescom | 2025-11-05 |

## 4️⃣ Správa Kategórií

### Pridanie Novej Kategórie:

1. Na domovskej stránke nájdi časť "Kategórie"
2. Klikni na tlačítko "+ Pridaj Kategóriu"
3. Vyplň:
   - **Názov** - Napr. "Zdravotnictvo"
   - **Ikona** - Emoji znak (napr. ⚕️)
   - **Popis** - Popis kategórie (voliteľne)
4. Klikni "Vytvor Kategóriu"

## 5️⃣ Prehliadanie Výdavkov

### Na Domovskej Stránke:

- Všetky výdavky sú zobrazené v zozname
- Pre každý výdavok vidíš:
  - Kategóriu s ikonou
  - Suma v eurách
  - Popis a dátum
  - Tlačítka na úpravu alebo zmazanie

### Filtrovanie:

1. Zadaj rok a mesiac
2. Klikni na "Filtrovať"
3. Zoznam sa zmení na vybrané výdavky

## 6️⃣ Štatistika

### Prístup:

1. Klikni na "Štatistika" v menu
2. (Voliteľne) Vyber rok z rozbaľovacieho zoznamu

### Čo Vidíš:

- **Zhrnutie**
  - Celkové výdavky za rok
  - Počet transakcií
  - Priemer na mesiac

- **Výdavky podľa Kategórií**
  - Farebné kartičky pre každú kategóriu
  - Súma výdavkov v každej kategórii

- **Mesačné Výdavky**
  - Graf ukazujúci trendy počas roka
  - Vizualizácia mesačných nákladov

- **Podrobný Prehľad**
  - Detailný zoznam všetkých kategórií
  - Počet transakcií v kategórii

## 7️⃣ Porovnanie Rokov

### Postup:

1. Klikni na "Porovnanie" v menu
2. Vyber dva roky na porovnanie
3. (Voliteľne) Vyber konkrétnu kategóriu
4. Systém automaticky aktualizuje grafy

### Čo sa Porovnáva:

- **Graf** - Mesačné výdavky v oboch rokoch
- **Súhrn** - Celkové výdavky a percentuálna zmena
- **Detailný Prehľad** - Mesiac po mesiaci porovnanie

### Interpretácia:

- **Červená šípka** (↑) = Výdavky vzrástli
- **Zelená šípka** (↓) = Výdavky poklesli
- **Percentá** = Zmena v percentách

## 8️⃣ Export a Záloha

### Databáza

Všetky tvoje dáta sú uložené v súbore `expenses.db` v priečinku aplikácie.

### Záloha:

1. Skopíruj súbor `expenses.db` na bezpečné miesto
2. Napríklad na USB kľúč alebo do cloudu

## 9️⃣ Tipy a Triky

### ✅ Dobré Praktiky:

- **Pravidelne zadávaj výdavky** - Neničovať si ich na konci mesiaca
- **Používaj konzistentné názvy** - Napr. vždy "Tescom" nie "Tesco", "Tescom", atď.
- **Pridaj opisný text** - Pomôže ti pamätať si detaily
- **Pravidelne si prezerz štatistiky** - Monitoruj svoje výdavky

### 🎯 Analýza:

- Ktorá kategória ťa najviac stojí?
- Ako sa tvoje výdavky zmenili rok od roka?
- Sú nejaké anomálie v mesiacoch?

## 🔟 Riešenie Problémov

### Aplikácia sa nespúšťa

- Skontroluj, či máš Python 3.7+
- Skúš manuálne nainštalovať balíčky: `pip install -r requirements.txt`
- Reštartuj aplikáciu

### Dáta sa nestratili

- Všetky dáta sú uložené v `expenses.db`
- Ak sa aplikácia zbiehol, môžeš ju znova spustiť
- Skúš si urobiť zálohu `expenses.db`

### Výdavky sa nezobrazujú

- Skontroluj filter (rok, mesiac)
- Skúš kliknúť na "Filtrovať" bez parametrov

---

## Ďalšie Otázky?

Pozri `README.md` pre technické informácie alebo skontaktuj vývojára.

Vďaka za používanie aplikácie! 💰
