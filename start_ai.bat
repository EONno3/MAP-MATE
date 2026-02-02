@echo off
cd packages\backend-ai
if not exist venv (
    echo Creating venv...
    python -m venv venv
)

echo Installing dependencies...
venv\Scripts\pip install -r requirements.txt

echo Starting Server...
venv\Scripts\python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0














