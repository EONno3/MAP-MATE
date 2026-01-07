@echo off
chcp 949 > nul
title Mapmate Docker - Stop

echo.
echo ============================================================
echo       Mapmate - Docker Stop
echo ============================================================
echo.

echo Stopping containers... (max 10 seconds)
docker-compose down -t 10

if %errorlevel% neq 0 (
    echo.
    echo Force stopping...
    docker-compose kill
    docker-compose down
)

echo.
echo [OK] Mapmate stopped.
echo.

pause
