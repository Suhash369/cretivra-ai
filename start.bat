@echo off
title Cretivra AI Launcher
echo ===================================================
echo           Starting Cretivra AI Platform
echo ===================================================
echo.
echo Launching Backend (FastAPI on Port 8000)...
start "Cretivra AI - Backend Server" cmd /k "set PYTHONPATH=backend&& .\backend\venv\Scripts\python -m uvicorn app.main:app --reload --port 8000"

echo Launching Frontend (Vite on Port 5173)...
start "Cretivra AI - Frontend App" cmd /k "npm run dev:vite"

echo.
echo Services starting:
echo  - Backend API & Docs: http://localhost:8000/docs
echo  - Frontend Web UI:    http://localhost:5173
echo.
pause
