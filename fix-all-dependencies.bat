@echo off
echo ========================================
echo Fixing All Dependencies and Starting Server
echo ========================================
echo.

echo Step 1: Setting execution policy...
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

echo.
echo Step 2: Installing server dependencies...
cd server
npm install

echo.
echo Step 3: Installing missing pdfkit...
npm install pdfkit

echo.
echo Step 4: Starting the backend server...
echo The server will start on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
