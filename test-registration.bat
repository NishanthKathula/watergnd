@echo off
echo ========================================
echo Testing Registration API
echo ========================================
echo.

echo Testing registration endpoint...
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"citizen\",\"latitude\":28.6139,\"longitude\":77.2090}"

echo.
echo.
echo If you see a success response above, the registration is working!
echo If you see an error, check the server logs.
echo.
pause
