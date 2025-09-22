@echo off
echo ========================================
echo Starting Groundwater Detection System
echo ========================================
echo.

echo Step 1: Setting execution policy...
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

echo.
echo Step 2: Setting up environment variables...
if not exist .env (
    echo Creating .env file...
    echo # MongoDB Connection > .env
    echo MONGODB_URI=mongodb+srv://245122735307_db_user:Tharun%40123@cluster0.v7zegbz.mongodb.net/?retryWrites=true^^&w=majority^^&appName=Cluster0 >> .env
    echo. >> .env
    echo # JWT Secret >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo. >> .env
    echo # Server Configuration >> .env
    echo PORT=5000 >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # External APIs >> .env
    echo RAINFALL_API_URL=https://api.data.gov.in/resource/rainfall-data >> .env
    echo GOOGLE_MAPS_API_KEY=your-google-maps-api-key >> .env
    echo WEATHER_API_KEY=your-weather-api-key >> .env
    echo. >> .env
    echo # Frontend URL >> .env
    echo CLIENT_URL=http://localhost:3000 >> .env
    echo ✅ .env file created!
) else (
    echo ✅ .env file already exists!
)

echo.
echo Step 3: Installing server dependencies...
cd server
npm install

echo.
echo Step 4: Starting backend server...
echo The backend will start on http://localhost:5000
echo.
echo ⚠️  Keep this window open for the backend server
echo.
echo Starting backend server in 3 seconds...
timeout /t 3 /nobreak > nul

start "Backend Server" cmd /k "npm run dev"

echo.
echo Step 5: Starting frontend...
echo The frontend will start on http://localhost:3000
echo.
echo Starting frontend in 5 seconds...
timeout /t 5 /nobreak > nul

cd ..\client
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo ✅ Application Started Successfully!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo Both servers are starting in separate windows.
echo You can close this window once both are running.
echo.
pause
