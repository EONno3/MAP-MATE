@echo off
chcp 949 > nul
title Mapmate Docker Launcher

echo.
echo ============================================================
echo.
echo       Mapmate - Docker Launcher
echo.
echo ============================================================
echo.

:: Check if Docker is running
echo [1/4] Checking Docker status...
docker info > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop first.
    echo Download: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)
echo [OK] Docker is running

:: Stop existing containers (with timeout)
echo.
echo [2/4] Cleaning up existing containers...
docker-compose down -t 5 > nul 2>&1
echo [OK] Cleanup complete

:: Build and start containers
echo.
echo [3/4] Building and starting containers...
echo     (First run may take 5-10 minutes)
echo.
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start containers!
    echo.
    echo Check logs: docker-compose logs
    echo.
    pause
    exit /b 1
)

:: Wait for services to be ready
echo.
echo [4/4] Waiting for services to start...
timeout /t 5 /nobreak > nul

:: Done
echo.
echo ============================================================
echo.
echo [SUCCESS] Mapmate started successfully!
echo.
echo    Web UI:  http://localhost:3000
echo    API:     http://localhost:8000
echo.
echo Useful commands:
echo    Status:  docker-compose ps
echo    Logs:    docker-compose logs -f
echo    Stop:    docker-compose down
echo.
echo ============================================================
echo.

:: Open browser
echo Opening browser...
timeout /t 2 /nobreak > nul
start http://localhost:3000

echo.
echo Press any key to close this window...
pause > nul
