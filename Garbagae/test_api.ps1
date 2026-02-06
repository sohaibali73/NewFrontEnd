# test_api.ps1
Write-Host "=== Testing Analyst API ===" -ForegroundColor Cyan

# Test 1: Health
Write-Host "`n1. Health Check:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# Test 2: Root
Write-Host "`n2. Root Endpoint:" -ForegroundColor Yellow
try {
    $root = Invoke-RestMethod -Uri "http://localhost:8000/" -Method GET
    Write-Host "   Name: $($root.name)" -ForegroundColor Green
    Write-Host "   Version: $($root.version)" -ForegroundColor Green
    Write-Host "   Status: $($root.status)" -ForegroundColor Green
} catch {
    Write-Host "   FAILED: $_" -ForegroundColor Red
}

# Test 3: Docs available
Write-Host "`n3. API Docs:" -ForegroundColor Yellow
Write-Host "   Swagger UI: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   ReDoc: http://localhost:8000/redoc" -ForegroundColor Cyan

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "Open http://localhost:8000/docs in your browser to explore the full API" -ForegroundColor White