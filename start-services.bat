@echo off
echo.
echo ================================
echo Chat App - Iniciador de Servicios
echo ================================
echo.

REM Verificar si Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no está instalado o no está en el PATH
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si PHP está instalado
php --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PHP no está instalado o no está en el PATH
    echo Por favor instala PHP o verifica que esté en el PATH
    pause
    exit /b 1
)

REM Verificar si Angular CLI está instalado
ng version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Angular CLI no está instalado
    echo Instalando Angular CLI...
    npm install -g @angular/cli
    if %errorlevel% neq 0 (
        echo ERROR: No se pudo instalar Angular CLI
        pause
        exit /b 1
    )
)

REM Cambiar al directorio del script
cd /d "%~dp0"

REM Ejecutar el script de Node.js
node start-services.js

pause
