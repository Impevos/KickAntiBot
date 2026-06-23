# API Endpoint Test Script
$baseUrl = "http://localhost:3000"
$testEmail = "api-test-$(Get-Date -Format 'yyyyMMddHHmmss')@kickantibot.test"
$testPassword = "TestPass123!"
$results = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int[]]$ExpectedStatus = @(200, 201)
    )
    
    $params = @{
        Uri = $Url
        Method = $Method
        Headers = $Headers
        ContentType = "application/json"
        ErrorAction = "Stop"
    }
    
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        $content = $response.Content | ConvertFrom-Json
        $pass = $ExpectedStatus -contains $status
        $results += [PSCustomObject]@{ Name=$Name; Status=$status; Pass=$pass; Error=$null }
        Write-Host "[PASS] $Name - $status" -ForegroundColor Green
        return $content
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        $pass = $ExpectedStatus -contains $status
        if ($pass) {
            Write-Host "[PASS] $Name - $status (expected error)" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] $Name - $status - $($errorBody.error.message)" -ForegroundColor Red
        }
        $script:results += [PSCustomObject]@{ Name=$Name; Status=$status; Pass=$pass; Error=$errorBody.error.message }
        return $errorBody
    }
}

Write-Host "`n=== Kick Anti-Bot API Tests ===`n" -ForegroundColor Cyan

# 1. Register
$register = Test-Endpoint -Name "POST /api/auth/register" -Method POST -Url "$baseUrl/api/auth/register" -Body @{
    email = $testEmail
    password = $testPassword
    displayName = "API Test User"
}

# 2. Login
$login = Test-Endpoint -Name "POST /api/auth/login" -Method POST -Url "$baseUrl/api/auth/login" -Body @{
    email = $testEmail
    password = $testPassword
}
$token = $login.data.accessToken
$authHeaders = @{ Authorization = "Bearer $token" }

# 3. Login with wrong password (should fail 401)
Test-Endpoint -Name "POST /api/auth/login (wrong password)" -Method POST -Url "$baseUrl/api/auth/login" -Body @{
    email = $testEmail
    password = "wrongpassword"
} -ExpectedStatus @(401) | Out-Null

# 4. Get profile
Test-Endpoint -Name "GET /api/auth/me" -Method GET -Url "$baseUrl/api/auth/me" -Headers $authHeaders | Out-Null

# 5. Update profile
Test-Endpoint -Name "PATCH /api/auth/me" -Method PATCH -Url "$baseUrl/api/auth/me" -Headers $authHeaders -Body @{
    displayName = "Updated Test User"
} | Out-Null

# 6. Unauthorized access (should fail 401)
Test-Endpoint -Name "GET /api/channels (no auth)" -Method GET -Url "$baseUrl/api/channels" -ExpectedStatus @(401) | Out-Null

# 7. Create channel
$channel = Test-Endpoint -Name "POST /api/channels" -Method POST -Url "$baseUrl/api/channels" -Headers $authHeaders -Body @{
    kickChannelId = "test-channel-$(Get-Random)"
    channelName = "Test Channel"
}
$channelId = $channel.data.id

# 8. List channels
Test-Endpoint -Name "GET /api/channels" -Method GET -Url "$baseUrl/api/channels" -Headers $authHeaders | Out-Null

# 9. Get channel by id
Test-Endpoint -Name "GET /api/channels/:id" -Method GET -Url "$baseUrl/api/channels/$channelId" -Headers $authHeaders | Out-Null

# 10. Update channel
Test-Endpoint -Name "PUT /api/channels/:id" -Method PUT -Url "$baseUrl/api/channels/$channelId" -Headers $authHeaders -Body @{
    channelName = "Updated Test Channel"
} | Out-Null

# 11. Protection settings - get
Test-Endpoint -Name "GET /api/protection-settings" -Method GET -Url "$baseUrl/api/protection-settings?channelId=$channelId" -Headers $authHeaders | Out-Null

# 12. Protection settings - update
Test-Endpoint -Name "PATCH /api/protection-settings" -Method PATCH -Url "$baseUrl/api/protection-settings?channelId=$channelId" -Headers $authHeaders -Body @{
    autoBlockEnabled = $true
    riskScoreThreshold = 75
} | Out-Null

# 13. Create suspicious user
$suspicious = Test-Endpoint -Name "POST /api/suspicious-users" -Method POST -Url "$baseUrl/api/suspicious-users" -Headers $authHeaders -Body @{
    kickUserId = "kick-user-$(Get-Random)"
    username = "suspicious_bot_123"
    channelId = $channelId
    reason = "Aşırı hızlı mesaj gönderimi"
    tags = @("spam", "bot")
    severity = "HIGH"
}
$suspiciousUserId = $suspicious.data.id

# 14. List suspicious users
Test-Endpoint -Name "GET /api/suspicious-users" -Method GET -Url "$baseUrl/api/suspicious-users?channelId=$channelId" -Headers $authHeaders | Out-Null

# 15. Get suspicious user by id
Test-Endpoint -Name "GET /api/suspicious-users/:id" -Method GET -Url "$baseUrl/api/suspicious-users/$suspiciousUserId" -Headers $authHeaders | Out-Null

# 16. Create risk score
Test-Endpoint -Name "POST /api/risk-scores" -Method POST -Url "$baseUrl/api/risk-scores" -Headers $authHeaders -Body @{
    suspiciousUserId = $suspiciousUserId
    score = 85
    reason = "Yüksek mesaj frekansı tespit edildi"
    algorithmVersion = "v1.0.0"
} | Out-Null

# 17. Get risk scores
Test-Endpoint -Name "GET /api/risk-scores/:suspiciousUserId" -Method GET -Url "$baseUrl/api/risk-scores/$suspiciousUserId" -Headers $authHeaders | Out-Null

# 18. Missing channelId (should fail 400)
Test-Endpoint -Name "GET /api/alerts (no channelId)" -Method GET -Url "$baseUrl/api/alerts" -Headers $authHeaders -ExpectedStatus @(400) | Out-Null

# 19. List alerts
Test-Endpoint -Name "GET /api/alerts" -Method GET -Url "$baseUrl/api/alerts?channelId=$channelId" -Headers $authHeaders | Out-Null

# 20. Dashboard summary
Test-Endpoint -Name "GET /api/dashboard/summary" -Method GET -Url "$baseUrl/api/dashboard/summary?channelId=$channelId" -Headers $authHeaders | Out-Null

# 21. List reports
Test-Endpoint -Name "GET /api/reports" -Method GET -Url "$baseUrl/api/reports?channelId=$channelId" -Headers $authHeaders | Out-Null

# 22. Activity logs
Test-Endpoint -Name "GET /api/activity-logs" -Method GET -Url "$baseUrl/api/activity-logs?channelId=$channelId" -Headers $authHeaders | Out-Null

# 23. Logout
Test-Endpoint -Name "POST /api/auth/logout" -Method POST -Url "$baseUrl/api/auth/logout" -Headers $authHeaders | Out-Null

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.Pass }).Count
$failed = ($results | Where-Object { -not $_.Pass }).Count
Write-Host "Passed: $passed / $($results.Count)" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
if ($failed -gt 0) {
    Write-Host "Failed tests:" -ForegroundColor Red
    $results | Where-Object { -not $_.Pass } | ForEach-Object { Write-Host "  - $($_.Name): $($_.Error)" -ForegroundColor Red }
}

# Cleanup - delete test channel
try {
    Invoke-WebRequest -Uri "$baseUrl/api/channels/$channelId" -Method DELETE -Headers $authHeaders -ErrorAction Stop | Out-Null
    Write-Host "`nTest channel cleaned up." -ForegroundColor Gray
} catch {}

exit $failed
