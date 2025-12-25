@echo off
REM Skript na spustenie aplikácie na sledovanie nákladov (Windows)

REM Zisťuje cestu ku skriptu
set SCRIPT_DIR=%~dp0

REM Prejde do adresára aplikácie
cd /d "%SCRIPT_DIR%"

REM Skontroluje, či existuje virtuálne prostredie
if not exist "%SCRIPT_DIR%venv" (
    echo.
    echo Vytváram virtuálne prostredie...
    python -m venv venv
    echo Inštalujem balíčky...
    call venv\Scripts\pip.exe install -r requirements.txt
)

REM Spustí aplikáciu
echo.
echo 🚀 Spúšťam aplikáciu na sledovanie nákladov...
echo 📱 Aplikácia bude dostupná na http://localhost:5004
echo.
echo Stlač Ctrl+C pre zastavenie aplikácie
echo.

call venv\Scripts\python.exe run.py

pause
