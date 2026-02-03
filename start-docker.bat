@echo off
chcp 949 > nul
title Mapmate Docker Launcher

REM -----------------------------------------------------------------
REM Robust launcher for Docker Compose on Windows.
REM - Keeps window open (even on double click)
REM - Forces cmd delayed-expansion OFF (/v:off)
REM - Writes all docker output to docker-launch.log
REM - Avoids parentheses blocks with special characters to prevent
REM   "unexpected token" parser errors (., !, etc.)
REM -----------------------------------------------------------------

if /I "%~1" NEQ "--keep" (
  start "Mapmate Docker Launcher" cmd /v:off /k call "%~f0" --keep
  exit /b
)

setlocal EnableExtensions DisableDelayedExpansion

set "LOGFILE=%~dp0docker-launch.log"
> "%LOGFILE%" echo ============================================================
>> "%LOGFILE%" echo Mapmate Docker Launcher Log
>> "%LOGFILE%" echo Started: %date% %time%
>> "%LOGFILE%" echo ============================================================

echo.
echo ============================================================
echo.
echo       Mapmate - Docker Launcher
echo.
echo ============================================================
echo.

echo [1/4] Checking Docker status...
docker info >> "%LOGFILE%" 2>&1
if errorlevel 1 goto docker_not_running
echo [OK] Docker is running

echo.
echo [2/4] Cleaning up existing containers...
docker compose down -t 5 >> "%LOGFILE%" 2>&1
echo [OK] Cleanup complete

echo.
echo [3/4] Building and starting containers...
echo     - Frontend will be rebuilt with NO CACHE (to reflect UI changes)
echo     - First run may take 5-10 minutes
echo.

REM Force rebuild frontend without cache to avoid stale UI bundle
docker compose build --no-cache frontend >> "%LOGFILE%" 2>&1
if errorlevel 1 goto build_failed

docker compose up -d --build >> "%LOGFILE%" 2>&1
if errorlevel 1 goto up_failed

echo.
echo [4/4] Waiting for services to start...
powershell -NoProfile -Command "Start-Sleep -Seconds 5" > nul 2>&1

echo.
echo ============================================================
echo.
echo [SUCCESS] Mapmate started successfully!
echo.
echo    Web UI:  http://localhost:3000
echo    API:     http://localhost:8000
echo.
echo See log: "%LOGFILE%"
echo.

echo Opening browser...
powershell -NoProfile -Command "Start-Sleep -Seconds 2" > nul 2>&1
start http://localhost:3000

echo.
echo Press any key to close this window...
pause
exit /b 0

:docker_not_running
echo.
echo [ERROR] Docker is not running.
echo Please start Docker Desktop first.
echo Download: https://www.docker.com/products/docker-desktop
echo See log: "%LOGFILE%"
start notepad "%LOGFILE%"
pause
exit /b 1

:build_failed
echo.
echo [ERROR] Failed to build frontend image (no-cache).
echo See log: "%LOGFILE%"
start notepad "%LOGFILE%"
pause
exit /b 1

:up_failed
echo.
echo [ERROR] Failed to start containers.
echo See log: "%LOGFILE%"
start notepad "%LOGFILE%"
pause
exit /b 1
