# Test Public Lead Capture API
$headers = @{
    "Content-Type" = "application/json"
    "X-API-Key" = "sk_live_lXlnCdk5555uSQxE_Iu-OK62shpND290JnZUrc_6bt0"
}

$body = @{
    name = "Test Lead"
    email = "test@example.com"
    phone = "+36301234567"
    company = "Test Company"
    source = "chatbot"
    metadata = @{
        campaign = "winter-sale"
        referrer = "google"
    }
} | ConvertTo-Json

Write-Host "🚀 Testing Public Lead Capture API..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/public/leads" -Method Post -Headers $headers -Body $body

    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "🎯 Lead ID: $($response.data.id)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to: http://localhost:3000/[orgSlug]/leads"
    Write-Host "2. You should see the new lead in the list!"

} catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red

    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}
