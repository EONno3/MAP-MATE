@echo off
chcp 949 > nul
title Mapmate Launcher
setlocal EnableExtensions DisableDelayedExpansion

set "ROOT=%~dp0"
set "LOG_DOCKER=%ROOT%docker-launch.log"

if /I "%~1"=="help" goto :help
if /I "%~1"=="--help" goto :help
if /I "%~1"=="/?" goto :help

REM One-click default: start docker (recommended)
if "%~1"=="" goto :start_docker
if /I "%~1"=="menu" goto :menu

if /I "%~1"=="start" (
  shift
  goto :start
)

if /I "%~1"=="stop" (
  shift
  goto :stop
)

echo [ERROR] Unknown command: %~1
echo.
goto :help

:help
echo.
echo ============================================================
echo   Mapmate Launcher
echo ============================================================
echo.
echo Usage:
echo   mapmate.bat                 ^(one-click: start docker^)
echo   mapmate.bat menu            ^(interactive menu^)
echo   mapmate.bat start ^<docker^|local^|ai^> [--dry-run] [--no-browser]
echo   mapmate.bat stop  ^<docker^>          [--dry-run]
echo.
echo Examples:
echo   mapmate.bat start docker
echo   mapmate.bat start local
echo   mapmate.bat start ai
echo   mapmate.bat stop docker
echo.
exit /b 0

:menu
echo.
echo ==========================================
echo        MAPMATE LAUNCHER MENU
echo ==========================================
echo.
echo   1) Start (Docker Compose)  - Recommended
echo   2) Start (Local Dev)       - AI + Backend API + Frontend
echo   3) Start (AI only)         - FastAPI (8000)
echo   4) Stop  (Docker Compose)
echo   5) Help
echo   6) Exit
echo.
choice /c 123456 /n /m "Select: "
if errorlevel 6 exit /b 0
if errorlevel 5 goto :help_pause
if errorlevel 4 call "%~f0" stop docker & goto :eof_pause
if errorlevel 3 call "%~f0" start ai & goto :eof_pause
if errorlevel 2 call "%~f0" start local & goto :eof_pause
if errorlevel 1 call "%~f0" start docker & goto :eof_pause
goto :eof_pause

:help_pause
call "%~f0" help
goto :eof_pause

:eof_pause
echo.
echo Press any key to close...
pause > nul
exit /b 0

:start
if "%~1"=="" goto :start_menu
if /I "%~1"=="docker" shift & goto :start_docker
if /I "%~1"=="local" shift & goto :start_local
if /I "%~1"=="ai"    shift & goto :start_ai

echo [ERROR] Unknown start mode: %~1
echo.
goto :help

:start_menu
echo.
echo Start mode is required.
echo.
goto :help

:stop
if "%~1"=="" goto :stop_menu
if /I "%~1"=="docker" shift & goto :stop_docker

echo [ERROR] Unknown stop mode: %~1
echo.
goto :help

:stop_menu
echo.
echo Stop mode is required. (docker)
echo.
goto :help

REM ============================================================
REM Start: Docker
REM ============================================================
:start_docker
set "DRYRUN=0"
set "NOBROWSER=0"

:start_docker_flags
if "%~1"=="" goto :start_docker_run
if /I "%~1"=="--dry-run" set "DRYRUN=1" & shift & goto :start_docker_flags
if /I "%~1"=="--no-browser" set "NOBROWSER=1" & shift & goto :start_docker_flags
shift
goto :start_docker_flags

:start_docker_run
if "%DRYRUN%"=="1" (
  echo [dry-run] Would run Docker Compose start sequence.
  echo [dry-run] docker compose down -t 5
  echo [dry-run] docker compose build --no-cache frontend
  echo [dry-run] docker compose up -d --build
  echo [dry-run] open http://localhost:3080
  exit /b 0
)

REM Keep a log like the old start-docker.bat did
> "%LOG_DOCKER%" echo ============================================================
>> "%LOG_DOCKER%" echo Mapmate Docker Launcher Log
>> "%LOG_DOCKER%" echo Started: %date% %time%
>> "%LOG_DOCKER%" echo ============================================================

echo.
echo ============================================================
echo       Mapmate - Docker Launcher
echo ============================================================
echo.

echo [1/4] Checking Docker status...
docker info >> "%LOG_DOCKER%" 2>&1
if errorlevel 1 goto :docker_not_running
echo [OK] Docker is running

echo.
echo [2/4] Cleaning up existing containers...
docker compose down -t 5 >> "%LOG_DOCKER%" 2>&1
echo [OK] Cleanup complete

echo.
echo [3/4] Building and starting containers...
echo     - Frontend will be rebuilt with NO CACHE (to reflect UI changes)
echo.

docker compose build --no-cache frontend >> "%LOG_DOCKER%" 2>&1
if errorlevel 1 goto :docker_build_failed

docker compose up -d --build >> "%LOG_DOCKER%" 2>&1
if errorlevel 1 goto :docker_up_failed

echo.
echo [4/4] Waiting for services to start...
powershell -NoProfile -Command "Start-Sleep -Seconds 5" > nul 2>&1

echo.
echo ============================================================
echo [SUCCESS] Mapmate started successfully!
echo.
echo    Web UI:  http://localhost:3080
echo    API:     http://localhost:8000
echo.
echo See log: "%LOG_DOCKER%"
echo.

if "%NOBROWSER%"=="1" exit /b 0

echo Opening browser...
powershell -NoProfile -Command "Start-Sleep -Seconds 1" > nul 2>&1
start http://localhost:3080
exit /b 0

:docker_not_running
echo.
echo [ERROR] Docker is not running.
echo Please start Docker Desktop first.
echo See log: "%LOG_DOCKER%"
start notepad "%LOG_DOCKER%"
exit /b 1

:docker_build_failed
echo.
echo [ERROR] Failed to build frontend image (no-cache).
echo See log: "%LOG_DOCKER%"
start notepad "%LOG_DOCKER%"
exit /b 1

:docker_up_failed
echo.
echo [ERROR] Failed to start containers.
echo See log: "%LOG_DOCKER%"
start notepad "%LOG_DOCKER%"
exit /b 1

REM ============================================================
REM Stop: Docker
REM ============================================================
:stop_docker
set "DRYRUN=0"

:stop_docker_flags
if "%~1"=="" goto :stop_docker_run
if /I "%~1"=="--dry-run" set "DRYRUN=1" & shift & goto :stop_docker_flags
shift
goto :stop_docker_flags

:stop_docker_run
echo.
echo ============================================================
echo       Mapmate - Docker Stop
echo ============================================================
echo.

if "%DRYRUN%"=="1" (
  echo [dry-run] docker compose down -t 10
  exit /b 0
)

echo Stopping containers... (max 10 seconds)
docker compose down -t 10
if errorlevel 0 (
  echo.
  echo [OK] Mapmate stopped.
  exit /b 0
)

echo.
echo Force stopping...
docker compose kill
docker compose down
echo.
echo [OK] Mapmate stopped.
exit /b 0

REM ============================================================
REM Start: Local dev
REM ============================================================
:start_local
set "DRYRUN=0"
set "NOBROWSER=0"

:start_local_flags
if "%~1"=="" goto :start_local_run
if /I "%~1"=="--dry-run" set "DRYRUN=1" & shift & goto :start_local_flags
if /I "%~1"=="--no-browser" set "NOBROWSER=1" & shift & goto :start_local_flags
shift
goto :start_local_flags

:start_local_run
echo ==========================================
echo      MAPMATE LOCAL DEV LAUNCHER
echo ==========================================

if "%DRYRUN%"=="1" (
  echo [dry-run] Backend AI: packages\backend-ai (uvicorn :8000)
  echo [dry-run] Backend API: packages\backend-api (npm run dev)
  echo [dry-run] Frontend:   packages\frontend (npm run dev)
  exit /b 0
)

call :ensure_backend_ai || exit /b 1
call :ensure_node_deps "packages\backend-api" || exit /b 1
call :ensure_node_deps "packages\frontend" || exit /b 1

echo.
echo [1/3] Starting Backend AI (Port 8000)...
start "Backend AI" cmd /k ""%ROOT%packages\backend-ai\venv\Scripts\python" -m uvicorn main:app --reload --port 8000 --host 0.0.0.0"

echo.
echo [2/3] Starting Backend API...
start "Backend API" cmd /k "cd /d "%ROOT%packages\backend-api" ^&^& npm run dev"

echo.
echo [3/3] Starting Frontend (Vite)...
start "Frontend" cmd /k "cd /d "%ROOT%packages\frontend" ^&^& npm run dev"

echo.
echo ==========================================
echo      ALL SYSTEMS GO!
echo ==========================================
echo.
echo Backend AI:   http://localhost:8000
echo Frontend:     http://localhost:5173
echo.

if "%NOBROWSER%"=="1" exit /b 0
start http://localhost:5173
exit /b 0

REM ============================================================
REM Start: AI only (foreground)
REM ============================================================
:start_ai
set "DRYRUN=0"

:start_ai_flags
if "%~1"=="" goto :start_ai_run
if /I "%~1"=="--dry-run" set "DRYRUN=1" & shift & goto :start_ai_flags
shift
goto :start_ai_flags

:start_ai_run
if "%DRYRUN%"=="1" (
  echo [dry-run] packages\backend-ai (uvicorn :8000)
  exit /b 0
)

call :ensure_backend_ai || exit /b 1

pushd "%ROOT%packages\backend-ai"
echo Starting Backend AI...
"%ROOT%packages\backend-ai\venv\Scripts\python" -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
popd
exit /b 0

REM ============================================================
REM Helpers
REM ============================================================
:ensure_backend_ai
pushd "%ROOT%packages\backend-ai" || exit /b 1

if not exist venv (
  echo Creating venv...
  python -m venv venv || (popd & exit /b 1)
  venv\Scripts\python -m ensurepip > nul 2>&1
)

echo Installing dependencies...
venv\Scripts\python -m pip install -q -r requirements.txt || (popd & exit /b 1)

popd
exit /b 0

:ensure_node_deps
setlocal
set "REL=%~1"
if "%REL%"=="" (endlocal & exit /b 1)

pushd "%ROOT%%REL%" > nul 2>&1
if errorlevel 1 (endlocal & exit /b 1)

if not exist node_modules (
  echo Installing dependencies in %REL%...
  call npm install || (popd & endlocal & exit /b 1)
)

popd
endlocal
exit /b 0

