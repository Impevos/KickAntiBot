# Bot saldirisi simulasyonu — canli ortamda tam akis testi
# Kullanim: powershell -ExecutionPolicy Bypass -File .\scripts\simulate-bot-attack.ps1
# Opsiyonel: -BaseUrl "http://localhost:3000"

param(
  [string]$BaseUrl = "https://kick-anti-bot-backend.vercel.app",
  [string]$Email = "wtcn@gmail.com",
  [string]$Password = "Test123!"
)

$ErrorActionPreference = "Stop"
$ts = Get-Date -Format "yyyyMMddHHmmss"

function Api {
  param(
    [string]$Method = "GET",
    [string]$Path,
    [hashtable]$Headers = @{},
    [object]$Body = $null
  )
  $uri = "$BaseUrl$Path"
  $params = @{
    Uri = $uri
    Method = $Method
    Headers = $Headers
    ContentType = "application/json"
  }
  if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 6 -Compress) }
  return Invoke-RestMethod @params
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "  BOT SALDIRISI SIMULASYONU" -ForegroundColor Cyan
Write-Host "  Hedef: $BaseUrl" -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor White

# 1. Giris
Write-Host "[1/8] Giris yapiliyor..." -ForegroundColor Yellow
$login = Api -Method POST -Path "/api/auth/login" -Body @{ email = $Email; password = $Password }
$token = $login.data.accessToken
$auth = @{ Authorization = "Bearer $token" }
Write-Host "  OK — $($login.data.user.displayName)" -ForegroundColor Green

# 2. Kanal
Write-Host "[2/8] Kanal kontrolu..." -ForegroundColor Yellow
$channels = (Api -Path "/api/channels" -Headers $auth).data
if ($channels.Count -eq 0) {
  $ch = Api -Method POST -Path "/api/channels" -Headers $auth -Body @{
    kickChannelId = "wtcn"
    channelName = "WTCN Kanal"
  }
  $channelId = $ch.data.id
  Write-Host "  Kanal olusturuldu: $channelId" -ForegroundColor Green
} else {
  $channelId = $channels[0].id
  Write-Host "  Mevcut kanal: $($channels[0].channelName) ($channelId)" -ForegroundColor Green
}

# 3. Koruma ayarlari (bildirim acik, esik 70)
Write-Host "[3/8] Koruma ayarlari (alarm acik, esik 70)..." -ForegroundColor Yellow
Api -Method PATCH -Path "/api/protection-settings?channelId=$channelId" -Headers $auth -Body @{
  alertOnDetection = $true
  autoBlockEnabled = $true
  autoBanEnabled = $false
  riskScoreThreshold = 70
  maxMessagesPerMinute = 10
} | Out-Null
Write-Host "  OK" -ForegroundColor Green

# 4. Bot hesaplari tespit edildi (3 farkli saldiri tipi)
Write-Host "[4/8] 3 bot hesabi tespit ediliyor..." -ForegroundColor Yellow

$bots = @(
  @{
    kickUserId = "bot-spam-$ts-001"
    username = "rapid_spammer_01"
    reason = "Dakikada 52 mesaj — esik 10 (chat flood)"
    tags = @("spam", "bot", "chat-flood")
    severity = "HIGH"
    scores = @(42, 68, 85)
    scoreReasons = @("Mesaj hizi artti", "Spam kalibi tespit edildi", "Kritik flood — otomatik engelleme onerilir")
  },
  @{
    kickUserId = "bot-follow-$ts-002"
    username = "fake_follower_99"
    reason = "Son 5 dakikada 120 sahte takipci artisi"
    tags = @("follow-bot", "anomaly")
    severity = "HIGH"
    scores = @(55, 74)
    scoreReasons = @("Takipci spike", "Bot agi davranisi")
  },
  @{
    kickUserId = "bot-glitch-$ts-003"
    username = "copy_pasta_bot"
    reason = "Ayni mesaji 40 kez tekrarladi"
    tags = @("spam", "duplicate")
    severity = "MEDIUM"
    scores = @(38, 62, 79)
    scoreReasons = @("Tekrarlayan icerik", "Frekans esigi asildi", "Yuksek risk")
  }
)

$botIds = @()
foreach ($bot in $bots) {
  $created = Api -Method POST -Path "/api/suspicious-users" -Headers $auth -Body @{
    kickUserId = $bot.kickUserId
    username = $bot.username
    channelId = $channelId
    reason = $bot.reason
    tags = $bot.tags
    severity = $bot.severity
  }
  $id = $created.data.id
  $botIds += $id
  Write-Host "  + $($bot.username) -> $id" -ForegroundColor Gray

  for ($i = 0; $i -lt $bot.scores.Count; $i++) {
    Start-Sleep -Milliseconds 300
    Api -Method POST -Path "/api/risk-scores" -Headers $auth -Body @{
      suspiciousUserId = $id
      score = $bot.scores[$i]
      reason = $bot.scoreReasons[$i]
      algorithmVersion = "v1.0.0-sim"
      metadata = @{
        messagesPerMinute = $bot.scores[$i]
        simulatedAt = (Get-Date).ToString("o")
      }
    } | Out-Null
    Write-Host "    risk skoru: $($bot.scores[$i])" -ForegroundColor DarkGray
  }
}

# 5. Dashboard ozeti
Write-Host "[5/8] Dashboard analizi..." -ForegroundColor Yellow
$dash = (Api -Path "/api/dashboard/summary?channelId=$channelId" -Headers $auth).data
Write-Host "  Aktif alarm        : $($dash.activeAlertsCount)" -ForegroundColor White
Write-Host "  Supheli kullanici  : $($dash.totalSuspiciousUsersCount)" -ForegroundColor White
Write-Host "  Ort. risk skoru    : $($dash.averageRiskScore)" -ForegroundColor White
Write-Host "  Bugun yeni bot     : $($dash.todayStats.newBotsDetected)" -ForegroundColor White
Write-Host "  Bugun yeni alarm   : $($dash.todayStats.alertsCreated)" -ForegroundColor White

# 6. Bildirimler
Write-Host "[6/8] Bildirimler..." -ForegroundColor Yellow
$alerts = (Api -Path "/api/alerts?channelId=$channelId" -Headers $auth).data
Write-Host "  Toplam bildirim: $($alerts.Count)" -ForegroundColor White
foreach ($a in $alerts | Select-Object -First 5) {
  $read = if ($a.isRead) { "okundu" } else { "YENI" }
  Write-Host "  [$read] [$($a.severity)] $($a.message.Substring(0, [Math]::Min(70, $a.message.Length)))..." -ForegroundColor $(if (-not $a.isRead) { "Yellow" } else { "Gray" })
}

# 7. Aktivite loglari
Write-Host "[7/8] Aktivite loglari..." -ForegroundColor Yellow
$logs = (Api -Path "/api/activity-logs?channelId=$channelId&limit=15" -Headers $auth).data
Write-Host "  Son $($logs.Count) kayit:" -ForegroundColor White
foreach ($log in $logs | Select-Object -First 8) {
  Write-Host "  [$($log.type)] $($log.title)" -ForegroundColor Gray
}

# 8. Bot listesi detay
Write-Host "[8/8] Bot aktivite listesi..." -ForegroundColor Yellow
$list = (Api -Path "/api/suspicious-users?channelId=$channelId&limit=10" -Headers $auth).data
foreach ($u in $list) {
  Write-Host "  $($u.username) | $($u.severity) | $($u.status) | $($u.reason.Substring(0, [Math]::Min(50, $u.reason.Length)))..." -ForegroundColor White
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "  SIMULASYON TAMAMLANDI" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor White
Write-Host "`nSimdi tarayicida ac:" -ForegroundColor Cyan
Write-Host "  $BaseUrl" -ForegroundColor White
Write-Host "`nKontrol edilecek ekranlar:" -ForegroundColor Cyan
Write-Host "  Dashboard      -> istatistikler + alarmlar" -ForegroundColor Gray
Write-Host "  Bot Aktivite   -> 3 bot + risk gecmisi (tikla)" -ForegroundColor Gray
Write-Host "  Koruma Ayarlari-> esik ve otomatik engelleme" -ForegroundColor Gray
Write-Host "  Loglar         -> tum olaylar kronolojik" -ForegroundColor Gray
Write-Host "`nKanal ID (debug): $channelId`n" -ForegroundColor DarkGray
