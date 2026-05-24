@echo off
cd /d "%~dp0"
title BITSERVER CONTROL
cls
echo.
echo  ╔════════════════════════════╗
echo  ║   BITSERVER CONTROL v1.0   ║
echo  ╚════════════════════════════╝
echo.

:: Check if Node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js not found.
  echo  [INFO] Download from: https://nodejs.org
  echo.
  pause
  exit /b
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
  echo  [SETUP] Installing dependencies for first time...
  echo  [INFO] This may take 1-2 minutes...
  echo.
  call npm install
  if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] npm install failed. Check internet connection.
    echo.
    pause
    exit /b
  )
  echo  [OK] Dependencies installed.
  echo.
)

:: Check if port 3131 is already in use
netstat -an | findstr "0.0.0.0:3131" >nul 2>&1
if %errorlevel% equ 0 (
  echo  [WARN] Port 3131 is already in use.
  echo  [INFO] BITSERVER might already be running.
  echo  [INFO] Open: http://localhost:3131/app.html
  echo.
  pause
  exit /b
)

echo  [START] Launching BITSERVER CONTROL...
echo  [INFO] Browser will open automatically.
echo  [INFO] Keep this window OPEN while using the app.
echo  [INFO] Close this window to stop the server.
echo.

:: Run as admin check (needed for powercfg)
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo  [WARN] Not running as Administrator.
  echo  [WARN] Power settings may fail to apply.
  echo  [WARN] Right-click run.bat and select "Run as administrator"
  echo.
)

echo  [LAUNCH] Starting Node server...
echo.
start /b node server.js
timeout /t 2 /nobreak >nul
start http://localhost:3131/app.html
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Server crashed or failed to start.
  echo  [INFO] Check that port 3131 is free.
  echo.
  pause
  exit /b
)

echo.
echo  [STOP] Server stopped.
pause
