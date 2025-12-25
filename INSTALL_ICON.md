# 🎯 Inštalácia Ikony a Aliasu

## 🐧 Na Linuxe (GNOME/KDE)

### Automatická Inštalácia:

```bash
cd /home/narbon/Aplikácie/expense-tracker
./install-icon.sh
```

Skript automaticky:
- ✅ Kopíruje ikonu do `~/.local/share/icons/`
- ✅ Kopíruje `.desktop` súbor do `~/.local/share/applications/`
- ✅ Pridáva alias `naklady` do `~/.bashrc`

### Po Inštalácii:

1. **V termináli spusti:**
   ```bash
   naklady
   ```

2. **V Aplikačnom Menu:**
   - Hľadaj: "Sledovanie Nákladov" alebo "Náklady"
   - Alebo: "Všetky aplikácie" → Finance → "Sledovanie Nákladov"

3. **Vlastný Spustovací Script:**
   ```bash
   /home/narbon/Aplikácie/expense-tracker/naklady.cmd
   ```

---

## 🪟 Na Windowse

### Metóda 1: CMD Skratka (Najjednoduchšie)

1. Otvori Prieskumník súborov
2. Prejdi do: `C:\Users\[tvoje_meno]\Aplikácie\expense-tracker`
3. Pravý klik na `naklady.cmd`
4. **"Odoslať na" → "Plocha (vytvoriť skratku)"**
5. Teraz máš skratku na ploche!

### Metóda 2: Windows Skratka (.lnk)

1. Pravý klik na plochu
2. **"Nový" → "Skratka"**
3. Umiestnenie: 
   ```
   C:\Users\[tvoje_meno]\Aplikácie\expense-tracker\naklady.cmd
   ```
4. Názov: `Sledovanie Nákladov` alebo `Náklady`
5. Klikni "Dokončit"

### Metóda 3: PowerShell Alias

Otvori PowerShell ako administrátor a spusti:

```powershell
# Vytvor profil
if (!(Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Pridaj alias
Add-Content -Path $PROFILE -Value "Set-Alias -Name naklady -Value 'C:\Users\$env:USERNAME\Aplikácie\expense-tracker\naklady.cmd'"

# Aktivuj profil
& $PROFILE
```

Teraz môžeš spustiť:
```powershell
naklady
```

---

## 🔧 Manuálna Inštalácia na Linuxe

Ak `install-icon.sh` nefunguje, urob to ručne:

### 1. Kopíruj Ikonu

```bash
mkdir -p ~/.local/share/icons/hicolor/256x256/apps
cp /home/narbon/Aplikácie/expense-tracker/naklady-icon.svg ~/.local/share/icons/hicolor/256x256/apps/naklady.svg
```

### 2. Inštaluj Desktop Súbor

```bash
mkdir -p ~/.local/share/applications
cp /home/narbon/Aplikácie/expense-tracker/naklady.desktop ~/.local/share/applications/
chmod +x ~/.local/share/applications/naklady.desktop
```

### 3. Aktualizuj Desktop Databázu

```bash
update-desktop-database ~/.local/share/applications/
```

---

## ✨ Výsledok

Po inštalácii budeš mať:

| Platforma | Spustenie | Typ |
|-----------|-----------|-----|
| **Linux** | `naklady` v termináli | Alias |
| **Linux** | Aplikačné menu | Desktop |
| **Windows** | `naklady` v PowerShell | Alias |
| **Windows** | Skratka na ploche | `.cmd` súbor |
| **Všetko** | `./start.sh` alebo `start.bat` | Script |

---

## 🎨 Ikona

Úspešne vytvorená: `naklady-icon.svg`

Vlastnosti:
- 🟣 Gradient farieb (Purple-Blue)
- 💰 Euro symbol
- 🎯 Jednoduché a jasné
- 📱 Vhodná na všetky rozlíšenia

---

## ❓ Problémy?

### Alias `naklady` nefunguje

Riešenie:
```bash
# Načítaj bashrc znova
source ~/.bashrc

# Alebo reštartuj terminál
```

### Ikona sa nezobrazuje

Riešenie:
```bash
# Refresh ikonového cache
gtk-update-icon-cache ~/.local/share/icons/hicolor/
```

### Desktop ikona nefunguje

Riešenie:
- Klikni pravým tlačidlom na plochu
- "Obnoviť"
- Alebo reštartuj desktop manager

### Na Windowse nefunguje skratka

Riešenie:
- Skontroluj cestu v `naklady.cmd`
- Skúsi upraviť cestu na svoju cestu

---

Viac informácií: Pozri `README.md` a `QUICK_START.txt`

Posledná aktualizácia: 5. november 2025
