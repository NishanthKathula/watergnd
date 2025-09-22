@echo off
echo ========================================
echo Quick Start - Groundwater Detection System
echo ========================================
echo.

echo Step 1: Setting execution policy...
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

echo.
echo Step 2: Creating .env file...
cd server
echo MONGODB_URI=mongodb+srv://245122735307_db_user:Tharun%40123@cluster0.v7zegbz.mongodb.net/?retryWrites=true^^&w=majority^^&appName=Cluster0 > .env
echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
echo PORT=5000 >> .env
echo NODE_ENV=development >> .env

echo.
echo Step 3: Starting backend server...
echo The backend will start on http://localhost:5000
echo.
echo ⚠️  Keep this window open for the backend server
echo.
start "Backend Server" cmd /k "cd /d %~dp0server && Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass && npm run dev"

echo.
echo Step 4: Starting frontend...
echo The frontend will start on http://localhost:3000
echo.
cd ..\client
start "Frontend" cmd /k "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass && npm start"

echo.
echo ========================================
echo ✅ Both servers are starting!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo Wait for both servers to fully start before testing.
echo.
pause
