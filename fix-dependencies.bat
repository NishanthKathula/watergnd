@echo off
echo ========================================
echo Fixing Dependencies and Errors
echo ========================================
echo.

echo Step 1: Installing missing Tailwind plugins...
cd client
npm install @tailwindcss/forms @tailwindcss/typography
if %errorlevel% neq 0 (
    echo ❌ Error installing Tailwind plugins
    pause
    exit /b 1
)

echo.
echo Step 2: Installing missing PDF generation library...
npm install pdfkit
if %errorlevel% neq 0 (
    echo ❌ Error installing PDF library
    pause
    exit /b 1
)

echo.
echo Step 3: Going back to root directory...
cd ..

echo.
echo Step 4: Installing server dependencies...
cd server
npm install
if %errorlevel% neq 0 (
    echo ❌ Error installing server dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo ✅ Dependencies Fixed!
echo ========================================
echo.
echo Now you can run:
echo npm run dev
echo.
pause
