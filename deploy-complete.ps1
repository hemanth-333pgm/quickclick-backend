# QuickClick - Complete Render Deployment
Write-Host "🚀 QuickClick Render Deployment" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

# 1. Verify files exist
Write-Host "`n📁 Verifying files..." -ForegroundColor Yellow

$files = @(
    ".node-version",
    ".npmrc",
    "package.json",
    "tsconfig.json",
    "dist/server.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file missing" -ForegroundColor Red
    }
}

# 2. Push to GitHub
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Deploy QuickClick backend to Render"
git push origin main
Write-Host "✅ Code pushed to GitHub" -ForegroundColor Green

Write-Host "`n✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS IN RENDER DASHBOARD:" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣ Go to: https://dashboard.render.com" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣ Click on your 'quickclick-backend' service" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣ Go to 'Settings' tab" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣ Update 'Build Command' to:" -ForegroundColor White
Write-Host "   npm install && npm run build" -ForegroundColor Yellow
Write-Host ""
Write-Host "5️⃣ Add Environment Variable:" -ForegroundColor White
Write-Host "   Key: NODE_VERSION" -ForegroundColor Yellow
Write-Host "   Value: 20.18.0" -ForegroundColor Yellow
Write-Host ""
Write-Host "6️⃣ Click 'Manual Deploy' → 'Deploy latest commit'" -ForegroundColor White
Write-Host ""
Write-Host "7️⃣ Wait for deployment to complete (5-10 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "8️⃣ Test your API:" -ForegroundColor White
Write-Host "   https://quickclick-backend.onrender.com/health" -ForegroundColor Yellow
