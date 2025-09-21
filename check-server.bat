@echo off
echo ========================================
echo Checking Server Status
echo ========================================
echo.

echo Testing if server is running on http://localhost:5000...
curl -s http://localhost:5000/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Server is running successfully!
    echo You can now access the application at:
    echo - Frontend: http://localhost:3000
    echo - Backend: http://localhost:5000
) else (
    echo ❌ Server is not running or not responding
    echo Please run fix-all-dependencies.bat to start the server
)

echo.
pause
