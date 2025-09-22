@echo off
echo ========================================
echo Starting Simple Backend Server
echo ========================================
echo.

echo Step 1: Setting execution policy...
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

echo.
echo Step 2: Going to server directory...
cd server

echo.
echo Step 3: Starting simple server...
echo The server will start on http://localhost:5000
echo.
echo ⚠️  Keep this window open for the backend server
echo.

node simple-server.js

pause
