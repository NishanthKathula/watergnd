@echo off
echo ========================================
echo Testing Server Connection
echo ========================================
echo.

echo Testing if backend server is running on port 5000...
curl -s http://localhost:5000 > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server is running!
    echo.
    echo Testing API endpoints...
    curl -s http://localhost:5000/api/auth/register
    echo.
    echo ✅ API is responding!
) else (
    echo ❌ Backend server is not running
    echo.
    echo Please start the server first:
    echo 1. Open a new command prompt
    echo 2. cd server
    echo 3. Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    echo 4. npm run dev
)

echo.
pause
