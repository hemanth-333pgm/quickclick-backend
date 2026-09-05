# QuickClick API Test Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    QUICKCLICK API TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Health Check
Write-Host "1️⃣ Health Check:" -ForegroundColor Yellow
$result = curl.exe -s http://localhost:5000/health
Write-Host $result
Write-Host ""

# 2. Database Status
Write-Host "2️⃣ Database Status:" -ForegroundColor Yellow
$result = curl.exe -s http://localhost:5000/health/db
Write-Host $result
Write-Host ""

# 3. API Ping
Write-Host "3️⃣ API Ping:" -ForegroundColor Yellow
$result = curl.exe -s http://localhost:5000/api/v1/ping
Write-Host $result
Write-Host ""

# 4. Products
Write-Host "4️⃣ Products List:" -ForegroundColor Yellow
$result = curl.exe -s http://localhost:5000/api/v1/products
Write-Host $result
Write-Host ""

# 5. Send OTP
Write-Host "5️⃣ Send OTP:" -ForegroundColor Yellow
$result = curl.exe -s -X POST http://localhost:5000/api/v1/auth/send-otp -H "Content-Type: application/json" -d "{\"mobile\":\"+919999999999\"}"
Write-Host $result
Write-Host ""

# 6. Verify OTP
Write-Host "6️⃣ Verify OTP:" -ForegroundColor Yellow
$result = curl.exe -s -X POST http://localhost:5000/api/v1/auth/verify-otp -H "Content-Type: application/json" -d "{\"mobile\":\"+919999999999\",\"otp\":\"123456\"}"
Write-Host $result
Write-Host ""

# 7. Zones Serviceability
Write-Host "7️⃣ Zones Serviceability:" -ForegroundColor Yellow
$result = curl.exe -s "http://localhost:5000/api/v1/zones/serviceability?pincode=682001&lat=9.9312&lng=76.2673"
Write-Host $result
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ TEST COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
