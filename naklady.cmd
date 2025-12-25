@echo off
REM Windows skratka na spustenie aplikácie Sledovanie Nákladov

setlocal enabledelayedexpansion

REM Cesta k projektu
set PROJECT_DIR=C:\Users\%USERNAME%\Aplikácie\expense-tracker

REM Skontroluj, či existuje projekt
if not exist "%PROJECT_DIR%" (
    echo Error: Projekt nenájdený na "%PROJECT_DIR%"
    echo Skopíruj projekt do: C:\Users\[tvoje_meno]\Aplikácie\expense-tracker
    pause
    exit /b 1
)

REM Spusti start.bat
cd /d "%PROJECT_DIR%"
call start.bat

endlocal
