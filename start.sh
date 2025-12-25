#!/bin/bash

# Skript na spustenie aplikácie na sledovanie nákladov

# Zistí absolútnu cestu k skriptu
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Prejdi do adresára aplikácie
cd "$SCRIPT_DIR"

# Skontroluj, či existuje virtuálne prostredie
if [ ! -d "$SCRIPT_DIR/venv" ]; then
    echo "❌ Virtuálne prostredie neexistuje!"
    echo "Vytváram virtuálne prostredie..."
    python3 -m venv venv
    echo "Inštalujem balíčky..."
    $SCRIPT_DIR/venv/bin/pip install -r requirements.txt
fi

# Spusti aplikáciu
echo "🚀 Spúšťam aplikáciu na sledovanie nákladov..."
echo "📱 Aplikácia bude dostupná na http://localhost:5004"
echo ""
echo "Stlač Ctrl+C pre zastavenie aplikácie"
echo ""

$SCRIPT_DIR/venv/bin/python $SCRIPT_DIR/run.py
