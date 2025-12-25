#!/bin/bash

# Inštalácia ikonky a aliasu pre aplikáciu Sledovanie Nákladov

echo "📦 Inštalácia Sledovanie Nákladov..."
echo ""

# Cesty
APP_DIR="/home/narbon/Aplikácie/expense-tracker"
ICONS_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"
DESKTOP_DIR="$HOME/.local/share/applications"

# Vytvorenie adresárov
mkdir -p "$ICONS_DIR"
mkdir -p "$DESKTOP_DIR"

# Kopírovanie ikony
if [ -f "$APP_DIR/naklady-icon.svg" ]; then
    cp "$APP_DIR/naklady-icon.svg" "$ICONS_DIR/naklady.svg"
    echo "✅ Ikona bola skopírovaná"
else
    echo "⚠️  Ikona nenájdená"
fi

# Kopírovanie spustovacieho scriptu
if [ -f "$APP_DIR/naklady-app" ]; then
    chmod +x "$APP_DIR/naklady-app"
    echo "✅ Spustovací script bol pripravený"
else
    echo "⚠️  Spustovací script nenájdený"
fi

# Kopírovanie desktop súboru
if [ -f "$APP_DIR/naklady.desktop" ]; then
    cp "$APP_DIR/naklady.desktop" "$DESKTOP_DIR/naklady.desktop"
    chmod +x "$DESKTOP_DIR/naklady.desktop"
    echo "✅ Desktop súbor bol nainštalovaný"
else
    echo "⚠️  Desktop súbor nenájdený"
fi

# Aktualizácia desktop databázy
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

# Alias do .bashrc
if grep -q "^alias naklady=" ~/.bashrc; then
    # Update existing alias to point to naklady-app
    sed -i "s|^alias naklady=.*|alias naklady='$APP_DIR/naklady-app'|" ~/.bashrc
    echo "ℹ️  Alias 'naklady' bol aktualizovaný v ~/.bashrc"
else
    echo "" >> ~/.bashrc
    echo "# Alias pre aplikáciu Sledovanie Nákladov" >> ~/.bashrc
    echo "alias naklady='$APP_DIR/naklady-app'" >> ~/.bashrc
    echo "✅ Alias 'naklady' bol pridaný do ~/.bashrc"
fi

echo ""
echo "🎉 Inštalácia dokončená!"
echo ""
echo "📋 Ako používať:"
echo "  1. Terminal: naklady"
echo "  2. Aplikačné menu: Hľadaj 'Sledovanie Nákladov'"
echo "  3. Desktop: Dvakliková ikona (bez terminálu!)"
echo ""
echo "💡 Tip: Spustite 'source ~/.bashrc' pre aktiváciu aliasu v aktuálnom termináli"
echo "💡 Tip: Aplikácia sa otvára priamo bez viditeľného terminálu!"
