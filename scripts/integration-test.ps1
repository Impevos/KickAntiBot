# Backend + Frontend entegrasyon testi
# Bu script backend'in canli calisip calismadigini ve API'lerin dogru yanit verdigini kontrol eder.

$baseUrl = "http://localhost:3000"
$passed = 0
$failed = 0
$notes = @()

function Test-Step {
    param([string]$Name, [scriptblock]$Action)
    Write-Host "`n--- $Name ---" -ForegroundColor Cyan
    try {
        $result = & $Action
        Write-Host "[OK] $Name" -ForegroundColor Green
        $script:passed++
        return $result
    } catch {
        $msg = $_.ErrorDetails.Message
        if (-not $msg) { $msg = $_.Exception.Message }
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        Write-Host "  $msg" -ForegroundColor Yellow
        $script:failed++
        $script:notes += "$Name : $msg"
        return $null
    }
}

Write-Host "========================================" -ForegroundColor White
Write-Host "  KICK ANTI-BOT ENTEGRASYON TESTI" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White

# ADIM 1: Backend ayakta mi?
Test-Step "1. Backend sunucusu calisiyor mu?" {
    $body = '{"email":"notvalid","password":"123456"}'
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($err.error.statusCode -eq 400 -or $err.error.statusCode -eq 401) {
            return "Backend yanit veriyor (status $($err.error.statusCode))"
        }
        throw
    }
}

# ADIM 2: Auth olmadan erisim engelleniyor mu?
Test-Step "2. Korumali endpoint token istiyor mu? (401 bekleniyor)" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/channels" -Method GET
        throw "Token olmadan erisim acik - bu bir guvenlik sorunu!"
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($err.error.statusCode -ne 401) { throw "Beklenen 401, gelen: $($err.error.statusCode)" }
        return "401 - Yetkisiz erisim dogru sekilde engellendi"
    }
}

# ADIM 3: Gecersiz email reddediliyor mu?
Test-Step "3. Form dogrulama calisiyor mu? (gecersiz email)" {
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body '{"email":"bozuk-email","password":"Test123!"}' -ContentType "application/json"
        throw "Gecersiz email kabul edildi!"
    } catch {
        $err = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($err.error.statusCode -ne 400) { throw "Beklenen 400" }
        return "400 - Gecersiz email reddedildi: $($err.error.message)"
    }
}

# ADIM 4: Kayit + Giris + Tum akis
$testEmail = "entegrasyon.test.$(Get-Date -Format 'yyyyMMddHHmm')@gmail.com"
$testPass = "TestPass123!"

$registerResult = Test-Step "4a. Yeni kullanici kaydi" {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method POST -Body (@{
        email = $testEmail
        password = $testPass
        displayName = "Entegrasyon Test"
    } | ConvertTo-Json) -ContentType "application/json"
    if (-not $r.success) { throw "success=false" }
    return "Kullanici olusturuldu: $($r.data.user.email)"
}

$loginResult = Test-Step "4b. Giris yapma ve token alma" {
    $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body (@{
        email = $testEmail
        password = $testPass
    } | ConvertTo-Json) -ContentType "application/json"
    if (-not $r.data.accessToken) { throw "Token alinamadi" }
    return @{ token = $r.data.accessToken; user = $r.data.user }
}

if ($loginResult) {
    $token = $loginResult.token
    $headers = @{ Authorization = "Bearer $token" }

    Test-Step "4c. Profil bilgisi (GET /api/auth/me)" {
        $r = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method GET -Headers $headers
        if (-not $r.data.email) { throw "Profil verisi eksik" }
        return "Profil: $($r.data.displayName) ($($r.data.email))"
    }

    $channel = Test-Step "4d. Kanal olusturma" {
        $r = Invoke-RestMethod -Uri "$baseUrl/api/channels" -Method POST -Headers $headers -Body (@{
            kickChannelId = "test-kanal-$(Get-Random)"
            channelName = "Test Kanali"
        } | ConvertTo-Json) -ContentType "application/json"
        return $r.data
    }

    if ($channel) {
        $cid = $channel.id

        Test-Step "4e. Dashboard verisi" {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/dashboard/summary?channelId=$cid" -Method GET -Headers $headers
            return "Aktif alarm: $($r.data.activeAlertsCount), Supheli kullanici: $($r.data.totalSuspiciousUsersCount)"
        }

        Test-Step "4f. Koruma ayarlari" {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/protection-settings?channelId=$cid" -Method GET -Headers $headers
            return "Esik degeri: $($r.data.riskScoreThreshold)"
        }

        $suspicious = Test-Step "4g. Supheli kullanici ekleme (bot aktivite)" {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/suspicious-users" -Method POST -Headers $headers -Body (@{
                kickUserId = "bot-$(Get-Random)"
                username = "test_bot_user"
                channelId = $cid
                reason = "Test: hizli mesaj"
                tags = @("spam")
                severity = "HIGH"
            } | ConvertTo-Json) -ContentType "application/json"
            return $r.data
        }

        if ($suspicious) {
            Test-Step "4h. Bot listesi" {
                $r = Invoke-RestMethod -Uri "$baseUrl/api/suspicious-users?channelId=$cid" -Method GET -Headers $headers
                return "Listede $($r.meta.totalItems) kayit var"
            }

            Test-Step "4i. Risk skoru ekleme" {
                Invoke-RestMethod -Uri "$baseUrl/api/risk-scores" -Method POST -Headers $headers -Body (@{
                    suspiciousUserId = $suspicious.id
                    score = 82
                    reason = "Test risk skoru"
                    algorithmVersion = "v1.0.0"
                } | ConvertTo-Json) -ContentType "application/json" | Out-Null
                return "Risk skoru eklendi"
            }
        }

        Test-Step "4j. Alarm olusturma ve listeleme" {
            # Alarm dogrudan DB'den gelir; supheli kullanici eklenince otomatik alarm yok
            # Sadece liste endpoint'ini test ediyoruz
            $r = Invoke-RestMethod -Uri "$baseUrl/api/alerts?channelId=$cid" -Method GET -Headers $headers
            return "Alarm sayisi: $($r.data.Count)"
        }

        Test-Step "4k. Aktivite loglari" {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/activity-logs?channelId=$cid" -Method GET -Headers $headers
            return "Log kaydi: $($r.meta.totalItems)"
        }

        Test-Step "4l. Koruma ayari guncelleme" {
            $r = Invoke-RestMethod -Uri "$baseUrl/api/protection-settings?channelId=$cid" -Method PATCH -Headers $headers -Body '{"autoBlockEnabled":true,"riskScoreThreshold":80}' -ContentType "application/json"
            return "Guncellendi: autoBlock=$($r.data.autoBlockEnabled), esik=$($r.data.riskScoreThreshold)"
        }

        Test-Step "4m. Temizlik - test kanali silme" {
            Invoke-RestMethod -Uri "$baseUrl/api/channels/$cid" -Method DELETE -Headers $headers | Out-Null
            return "Test kanali silindi"
        }
    }
}

# ADIM 5: Frontend proxy testi (frontend calisiyorsa)
Test-Step "5. Frontend proxy (localhost:5173 uzerinden API)" {
    try {
        Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 3 | Out-Null
        try {
            Invoke-RestMethod -Uri "http://localhost:5173/api/auth/login" -Method POST -Body '{"email":"x","password":"123456"}' -ContentType "application/json"
        } catch {
            $err = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($err.error.statusCode) {
                return "Frontend proxy calisiyor - API istegi backend'e ulasti"
            }
        }
        throw "Proxy yaniti beklenmedik"
    } catch {
        if ($_.Exception.Message -match "actively refused|timed out") {
            return "Frontend su an calismiyor (normal - ayri baslatilmasi gerekir)"
        }
        throw
    }
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "  SONUC: $passed basarili, $failed basarisiz" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "========================================" -ForegroundColor White

if ($notes.Count -gt 0) {
    Write-Host "`nNotlar:" -ForegroundColor Yellow
    $notes | ForEach-Object { Write-Host "  - $_" }
}

exit $failed
