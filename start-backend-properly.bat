@echo off
echo ========================================
echo Starting Backend Server Properly
echo ========================================
echo.

echo Step 1: Setting execution policy...
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

echo.
echo Step 2: Going to server directory...
cd server

echo.
echo Step 3: Checking if index.js exists...
if not exist index.js (
    echo ❌ index.js not found in server directory
    echo Please make sure you're in the correct directory
    pause
    exit /b 1
)

echo ✅ index.js found

echo.
echo Step 4: Starting the server...
echo The server will start on http://localhost:5000
echo.
echo ⚠️  Keep this window open for the backend server
echo.

node index.js

pause
