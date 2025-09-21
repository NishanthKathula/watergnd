@echo off
echo ========================================
echo Starting Backend Server
echo ========================================
echo.

echo Step 1: Going to server directory...
cd server

echo.
echo Step 2: Installing dependencies (if needed)...
npm install

echo.
echo Step 3: Starting the backend server...
echo The server will start on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
