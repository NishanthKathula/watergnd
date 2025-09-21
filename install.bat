@echo off
echo ========================================
echo Groundwater Detection System Setup
echo ========================================
echo.

echo Step 1: Installing dependencies...
call npm run install-all
if %errorlevel% neq 0 (
    echo ❌ Error installing dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Creating environment file...
node setup.js

echo.
echo Step 3: Building frontend...
cd client
call npm run build
cd ..

echo.
echo ========================================
echo ✅ Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit the .env file with your configuration
echo 2. Start MongoDB (if using local installation)
echo 3. Run: npm run dev
echo.
echo The application will be available at:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:5000
echo.
pause
