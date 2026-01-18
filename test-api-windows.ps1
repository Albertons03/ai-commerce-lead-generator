# Windows-compatible PowerShell test script for API endpoints

param(
    [string]$ApiKey = "sk_live_oOO4ThxzbpxIAbS9iJ9ADxN6cu-4OEKfC_am9NkQf-o",
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "🧪 Testing AI Commerce Lead Generator APIs" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Yellow

# Test 1: Health Check (Main page)
Write-Host "`n📍 Test 1: Health Check" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri $BaseUrl -Method GET -TimeoutSec 10
    Write-Host "✅ Main page accessible: Status $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Main page error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test page accessibility
Write-Host "`n📍 Test 2: Test Pages" -ForegroundColor Green
$testPages = @(
    "/test-lead-capture",
    "/test-chat", 
    "/test-conversations",
    "/test-training"
)

foreach ($page in $testPages) {
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl$page" -Method GET -TimeoutSec 10
        Write-Host "✅ $page accessible: Status $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $page error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: API Endpoints
Write-Host "`n📍 Test 3: API Endpoints" -ForegroundColor Green

# Test Public Lead Capture API
Write-Host "`n🎯 Testing Public Lead Capture API" -ForegroundColor Yellow
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = $ApiKey
}

$leadData = @{
    name = "Test User $(Get-Date -Format 'HHmmss')"
    email = "test$(Get-Date -Format 'HHmmss')@example.com"
    phone = "+36301234567"
    company = "Test Company"
    source = "api_test"
    metadata = @{
        campaign = "test-campaign"
        test_run = $true
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/public/leads" -Method POST -Headers $headers -Body $leadData -TimeoutSec 30
    Write-Host "✅ Lead capture successful!" -ForegroundColor Green
    Write-Host "📄 Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Lead capture failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "📄 Error details: $responseBody" -ForegroundColor Yellow
    }
}

# Test Conversations API
Write-Host "`n🎯 Testing Conversations API" -ForegroundColor Yellow
$conversationData = @{
    organization_id = "9677edeb-0ac8-45e8-b2bc-c389cc99fac0"
    visitor_metadata = @{
        test = $true
        source = "powershell_test"
        timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/api/conversations" -Method POST -Headers @{"Content-Type"="application/json"} -Body $conversationData -TimeoutSec 30
    Write-Host "✅ Conversation creation successful!" -ForegroundColor Green
    Write-Host "📄 Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Conversation creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host "🎉 API Testing completed!" -ForegroundColor Cyan
Write-Host "`n💡 Next steps:" -ForegroundColor White
Write-Host "1. If tests failed, check if the dev server is running: npm run dev" -ForegroundColor Gray
Write-Host "2. Verify API key is valid in the database" -ForegroundColor Gray
Write-Host "3. Check the dashboard at: $BaseUrl/login" -ForegroundColor Gray