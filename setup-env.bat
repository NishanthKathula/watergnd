@echo off
echo ========================================
echo Setting up Environment Variables
echo ========================================
echo.

echo Creating .env file with MongoDB connection...

echo # MongoDB Connection > .env
echo MONGODB_URI=mongodb+srv://nishanthkatthula:tharun123@cluster0.8qgqj.mongodb.net/groundwater?retryWrites=true^&w=majority >> .env
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

echo.
echo ✅ .env file created successfully!
echo.
echo Now you can start the server with:
echo npm run dev
echo.
pause
