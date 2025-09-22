@echo off
echo ========================================
echo Testing Registration API
echo ========================================
echo.

echo Testing if server is running...
netstat -an | findstr :5000
if %errorlevel% neq 0 (
    echo ❌ Server is not running on port 5000
    echo Please start the server first
    pause
    exit /b 1
)

echo ✅ Server is running on port 5000
echo.

echo Testing registration API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/register' -Method POST -Headers @{'Content-Type'='application/json'} -Body '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\",\"role\":\"citizen\",\"latitude\":28.6139,\"longitude\":77.2090}'; Write-Host 'Status:' $response.StatusCode; Write-Host 'Response:' $response.Content } catch { Write-Host 'Error:' $_.Exception.Message }"

echo.
echo If you see a success response above, the API is working!
echo.
pause
