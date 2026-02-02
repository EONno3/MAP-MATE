@echo off
setlocal

echo ==========================================
echo      MAPMATE INTEGRATED LAUNCHER
echo ==========================================

REM -------------------------------------------
REM 1. Backend AI (Python) Setup & Start
REM -------------------------------------------
echo [1/3] Starting Backend AI (Port 8000)...
cd packages\backend-ai
if not exist venv (
    echo    - Creating Python virtual environment...
    python -m venv venv
    echo    - Installing pip...
    venv\Scripts\python -m ensurepip
)

echo    - Checking dependencies...
venv\Scripts\python -m pip install -q -r requirements.txt

echo    - Launching Server...
start "Backend AI" cmd /k "venv\Scripts\python -m uvicorn main:app --reload --port 8000"
cd ..\..

REM -------------------------------------------
REM 2. Backend API (Node) Setup & Start
REM -------------------------------------------
echo [2/3] Starting Backend API (Port 3001)...
cd packages\backend-api
if not exist node_modules (
    echo    - Installing dependencies...
    call npm install
)
echo    - Launching Server...
start "Backend API" cmd /k "npm run dev"
cd ..\..

REM -------------------------------------------
REM 3. Frontend (React) Setup & Start
REM -------------------------------------------
echo [3/3] Starting Frontend (Port 3000)...
cd packages\frontend
if not exist node_modules (
    echo    - Installing dependencies...
    call npm install
)
echo    - Launching Server...
start "Frontend" cmd /k "npm run dev"
cd ..\..

echo ==========================================
echo      ALL SYSTEMS GO!
echo ==========================================
echo.
echo Access Mapmate at: http://localhost:3000
echo.
pause













