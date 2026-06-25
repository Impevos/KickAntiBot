# Guvenlik testleri - canli backend uzerinde
$baseUrl = "http://localhost:3000"
$pass = 0
$fail = 0

function Check {
    param([string]$Name, [int]$Expected, [scriptblock]$Action)
    try {
        $null = & $Action
        $got = 200
    } catch {
        $got = $_.Exception.Response.StatusCode.value__
    }
    if ($got -eq $Expected) {
        Write-Host "[OK] $Name -> $got (beklenen $Expected)" -ForegroundColor Green
        $script:pass++
    } else {
        Write-Host "[FAIL] $Name -> $got (beklenen $Expected)" -ForegroundColor Red
        $script:fail++
    }
}

Write-Host "`n=== GUVENLIK TESTLERI ===`n" -ForegroundColor Cyan

# 1. Yetkisiz erisim - token olmadan korumali endpoint
Check "Token olmadan /api/channels (yetkisiz)" 401 {
    Invoke-RestMethod -Uri "$baseUrl/api/channels" -Method GET
}

# 2. Gecersiz token
Check "Gecersiz token ile /api/channels" 401 {
    Invoke-RestMethod -Uri "$baseUrl/api/channels" -Method GET -Headers @{ Authorization = "Bearer sahte-token-123" }
}

# Oturum açıp geçerli bir token alalım (Doğrulama testlerinin guard arkasına geçebilmesi için)
Write-Host "Geçerli test kullanıcısı ile giriş yapılıyor..." -ForegroundColor Gray
try {
    $loginResult = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"wtcn_admin@gmail.com","password":"Test123!"}'
    $validToken = $loginResult.data.accessToken
    $validHeaders = @{ Authorization = "Bearer $validToken" }
    Write-Host "Giriş başarılı. Token alındı." -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Geçerli kullanıcı girişi başarısız, testler sahte token ile devam edecek." -ForegroundColor Yellow
    $validHeaders = @{ Authorization = "Bearer sahte-token-123" }
}

# 3. Gecersiz email formati (kayit dogrulama)
Check "Gecersiz email ile kayit" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"bozukemail","password":"Gecerli123!"}'
}

# 4. Zayif sifre (8 karakterden kisa)
Check "Zayif sifre ile kayit (kisa)" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"test@gmail.com","password":"123"}'
}

# 5. Sifre karmasiklik eksik (sadece harf)
Check "Karmasik olmayan sifre ile kayit" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"test@gmail.com","password":"sadececharfler"}'
}

# 6. Bilinmeyen alan gonderimi (forbidNonWhitelisted)
Check "Bilinmeyen fazladan alan ile kayit" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"test@gmail.com","password":"Gecerli123!","isAdmin":true,"role":"ADMIN"}'
}

# 7. Bos govde ile login
Check "Bos govde ile login" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body '{}'
}

# 8. Gecersiz UUID route parametresi (400 bekleniyor)
Check "Gecersiz UUID route parametresi (/api/channels/gecersiz-uuid)" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/channels/gecersiz-uuid" -Method GET -Headers $validHeaders
}

# 9. Gecersiz UUID query parametresi (400 bekleniyor)
Check "Gecersiz UUID query parametresi (/api/protection-settings?channelId=gecersiz)" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/protection-settings?channelId=gecersiz" -Method GET -Headers $validHeaders
}

# 10. Gecersiz enum query parametresi (400 bekleniyor)
Check "Gecersiz enum query parametresi (/api/suspicious-users)" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/suspicious-users?channelId=334475f9-e015-4ffa-8dd0-a47476e56004&status=GEÇERSİZ" -Method GET -Headers $validHeaders
}

# 11. Gecersiz sayfa numarasi (400 bekleniyor)
Check "Gecersiz sayfa numarasi query parametresi (/api/suspicious-users)" 400 {
    Invoke-RestMethod -Uri "$baseUrl/api/suspicious-users?channelId=334475f9-e015-4ffa-8dd0-a47476e56004&page=-5" -Method GET -Headers $validHeaders
}

Write-Host "`n=== RATE LIMIT TESTI (login) ===" -ForegroundColor Cyan
# 12. Login'e art arda 7 istek; 6. veya sonrasi 429 donmeli (limit 5/dk)
$got429 = $false
for ($i = 1; $i -le 7; $i++) {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"ratelimit@test.com","password":"YanlisSifre1"}' | Out-Null
        $code = 200
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
    }
    Write-Host "  Istek $i -> $code"
    if ($code -eq 429) { $got429 = $true }
}
if ($got429) {
    Write-Host "[OK] Rate limit calisiyor (429 Too Many Requests alindi)" -ForegroundColor Green
    $pass++
} else {
    Write-Host "[FAIL] Rate limit tetiklenmedi" -ForegroundColor Red
    $fail++
}

Write-Host "`n=== SONUC: $pass basarili, $fail basarisiz ===" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
