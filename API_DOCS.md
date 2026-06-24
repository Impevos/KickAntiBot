# Kick Anti-Bot Koruma Sistemi — Backend API

Bu doküman, frontend geliştiricilerin backend API'sine entegre olması için hazırlanmıştır.

**Base URL:** `http://localhost:3000` (geliştirme ortamı)

---

## Genel Kurallar

### Kimlik Doğrulama

Korumalı endpoint'ler için her istekte şu header gönderilmelidir:

```
Authorization: Bearer <accessToken>
```

`accessToken`, `/api/auth/login` yanıtındaki `data.accessToken` alanından alınır.

### Yanıt Formatı

Tüm endpoint'ler tutarlı bir JSON formatı kullanır.

**Başarılı yanıt:**
```json
{
  "success": true,
  "data": { ... },
  "message": "İsteğe bağlı bilgi mesajı",
  "meta": { ... }
}
```

> `message` ve `meta` alanları her endpoint'te olmayabilir. `meta` genellikle sayfalanmış listelerde bulunur.

**Hatalı yanıt:**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Hata açıklaması"
  }
}
```

### HTTP Status Kodları

| Kod | Anlamı |
|-----|--------|
| 200 | Başarılı (GET, PUT, PATCH, DELETE) |
| 201 | Başarılı oluşturma (POST) |
| 400 | Geçersiz istek (eksik/hatalı parametre) |
| 401 | Kimlik doğrulama hatası (token yok veya geçersiz) |
| 403 | Yetki hatası (başka kullanıcının verisine erişim) |
| 404 | Kayıt bulunamadı |

### Kanal Bazlı Veriler

Dashboard, şüpheli kullanıcılar, alarmlar, raporlar ve koruma ayarları gibi birçok endpoint `channelId` query parametresi gerektirir. Kullanıcının kanalları `GET /api/channels` veya `GET /api/auth/me` ile alınabilir.

---

## Frontend Ekran → Endpoint Eşleşmesi

Ümmü'nün geliştirdiği panel (`frontend/` klasörü) aşağıdaki endpoint'leri kullanır:

| Ekran | Route | Kullanılan Endpoint'ler |
|-------|-------|-------------------------|
| Giriş | `/login` | `POST /api/auth/login` |
| Kayıt | `/register` | `POST /api/auth/register` |
| Dashboard | `/dashboard` | `GET /api/dashboard/summary`, `GET /api/alerts` |
| Bot Aktivite | `/bot-activity` | `GET /api/suspicious-users`, `GET /api/suspicious-users/:id`, `GET /api/risk-scores/:id` |
| Koruma Ayarları | `/protection` | `GET /api/protection-settings`, `PATCH /api/protection-settings` |
| Log / Geçmiş | `/logs` | `GET /api/activity-logs` |
| Profil | `/profile` | `GET /api/auth/me`, `PATCH /api/auth/me`, `GET/POST/PUT/DELETE /api/channels` |

> Frontend servis dosyası: `frontend/src/services/api-services.ts`

---

## Tüm Endpoint Özeti

| Method | URL | Auth | Açıklama |
|--------|-----|------|----------|
| POST | `/api/auth/register` | Hayır | Kayıt ol |
| POST | `/api/auth/login` | Hayır | Giriş yap |
| POST | `/api/auth/logout` | Evet | Çıkış yap |
| GET | `/api/auth/me` | Evet | Profil bilgisi |
| PATCH | `/api/auth/me` | Evet | Profil güncelle |
| GET | `/api/channels` | Evet | Kanal listesi |
| POST | `/api/channels` | Evet | Kanal oluştur |
| GET | `/api/channels/:id` | Evet | Kanal detayı |
| PUT | `/api/channels/:id` | Evet | Kanal güncelle |
| DELETE | `/api/channels/:id` | Evet | Kanal sil |
| GET | `/api/dashboard/summary` | Evet | Dashboard özeti |
| GET | `/api/suspicious-users` | Evet | Şüpheli kullanıcı listesi |
| GET | `/api/suspicious-users/:id` | Evet | Şüpheli kullanıcı detayı |
| POST | `/api/suspicious-users` | Evet | Şüpheli kullanıcı ekle |
| GET | `/api/risk-scores/:suspiciousUserId` | Evet | Risk skoru geçmişi |
| POST | `/api/risk-scores` | Evet | Risk skoru ekle |
| GET | `/api/protection-settings` | Evet | Koruma ayarlarını getir |
| PATCH | `/api/protection-settings` | Evet | Koruma ayarlarını güncelle |
| GET | `/api/activity-logs` | Evet | Birleşik aktivite geçmişi |
| GET | `/api/alerts` | Evet | Alarm listesi |
| PATCH | `/api/alerts/:id/read` | Evet | Alarmı okundu işaretle |
| GET | `/api/reports` | Evet | Rapor listesi |
| GET | `/api/reports/:id` | Evet | Rapor detayı |

---

## 1. Kullanıcı Giriş / Kayıt

### Kayıt Ol
- **Method:** POST
- **URL:** `/api/auth/register`
- **Auth gerekli mi:** Hayır

**Request body:**
```json
{
  "email": "yayinci@email.com",
  "password": "GuvenliSifre123",
  "displayName": "Yayıncı Adı"
}
```

**Başarılı response (201):**
```json
{
  "success": true,
  "message": "Kullanıcı başarıyla kaydedildi.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "yayinci@email.com",
      "displayName": "Yayıncı Adı",
      "role": "STREAMER",
      "createdAt": "2026-06-20T10:00:00.000Z"
    }
  }
}
```

**Hatalı response (400):**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Geçerli bir e-posta adresi giriniz."
  }
}
```

---

### Giriş Yap
- **Method:** POST
- **URL:** `/api/auth/login`
- **Auth gerekli mi:** Hayır

**Request body:**
```json
{
  "email": "yayinci@email.com",
  "password": "GuvenliSifre123"
}
```

**Başarılı response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh-token",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "yayinci@email.com",
      "displayName": "Yayıncı Adı",
      "role": "STREAMER"
    }
  }
}
```

**Hatalı response (401):**
```json
{
  "success": false,
  "error": {
    "statusCode": 401,
    "message": "E-posta adresi veya şifre hatalı."
  }
}
```

---

### Çıkış Yap
- **Method:** POST
- **URL:** `/api/auth/logout`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı."
}
```

---

## 2. Dashboard Verileri

### Dashboard Özeti
- **Method:** GET
- **URL:** `/api/dashboard/summary?channelId={channelId}`
- **Auth gerekli mi:** Evet

**Query params:**
| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| channelId | Evet | Kanal UUID |

**Başarılı response (200):**
```json
{
  "success": true,
  "data": {
    "activeAlertsCount": 3,
    "totalSuspiciousUsersCount": 15,
    "averageRiskScore": 62.5,
    "recentAlerts": [
      {
        "id": "uuid",
        "type": "SPAM_ATTACK",
        "severity": "HIGH",
        "message": "Kanalınızda yoğun spam saldırısı tespit edildi.",
        "isRead": false,
        "createdAt": "2026-06-20T10:00:00.000Z"
      }
    ],
    "todayStats": {
      "alertsCreated": 2,
      "newBotsDetected": 1
    }
  }
}
```

**Hatalı response (400):**
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Dashboard özeti için channelId parametresi zorunludur."
  }
}
```

---

## 3. Bot Aktivite Listesi (Şüpheli Kullanıcılar)

### Şüpheli Kullanıcı Listesi
- **Method:** GET
- **URL:** `/api/suspicious-users?channelId={channelId}&status={status}&severity={severity}&search={search}&page={page}&limit={limit}`
- **Auth gerekli mi:** Evet

**Query params:**
| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| channelId | Evet | Kanal UUID |
| status | Hayır | `DETECTED`, `INVESTIGATING`, `SAFE`, `BANNED` |
| severity | Hayır | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| search | Hayır | Kullanıcı adında arama |
| page | Hayır | Sayfa numarası (varsayılan: 1) |
| limit | Hayır | Sayfa başına kayıt (varsayılan: 10) |

**Başarılı response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "kickUserId": "kick-user-123",
      "username": "suspicious_bot",
      "reason": "Aşırı hızlı mesaj gönderimi",
      "tags": ["spam", "bot"],
      "status": "DETECTED",
      "severity": "HIGH",
      "channelId": "uuid",
      "firstSeen": "2026-06-19T08:00:00.000Z",
      "lastSeen": "2026-06-20T10:00:00.000Z"
    }
  ],
  "meta": {
    "totalItems": 15,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 2,
    "currentPage": 1
  }
}
```

---

### Şüpheli Kullanıcı Detayı
- **Method:** GET
- **URL:** `/api/suspicious-users/{id}`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "kickUserId": "kick-user-123",
    "username": "suspicious_bot",
    "reason": "Aşırı hızlı mesaj gönderimi",
    "tags": ["spam", "bot"],
    "status": "DETECTED",
    "severity": "HIGH",
    "riskScores": [
      {
        "id": "uuid",
        "score": 85,
        "reason": "Yüksek mesaj frekansı",
        "algorithmVersion": "v1.0.0",
        "createdAt": "2026-06-20T10:00:00.000Z"
      }
    ]
  }
}
```

---

### Risk Skoru Geçmişi
- **Method:** GET
- **URL:** `/api/risk-scores/{suspiciousUserId}`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "score": 85,
      "reason": "Yüksek mesaj frekansı",
      "algorithmVersion": "v1.0.0",
      "metadata": { "messagesPerMinute": 52 },
      "createdAt": "2026-06-20T10:00:00.000Z"
    }
  ]
}
```

---

## 4. Koruma Ayarları

### Koruma Ayarlarını Getir
- **Method:** GET
- **URL:** `/api/protection-settings?channelId={channelId}`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "channelId": "uuid",
    "autoBlockEnabled": false,
    "autoBanEnabled": false,
    "alertOnDetection": true,
    "riskScoreThreshold": 70,
    "maxMessagesPerMinute": 10,
    "createdAt": "2026-06-20T10:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z"
  }
}
```

> Kanal oluşturulduğunda varsayılan ayarlar otomatik oluşturulur. Ayar kaydı yoksa ilk GET isteğinde oluşturulur.

---

### Koruma Ayarlarını Güncelle
- **Method:** PATCH
- **URL:** `/api/protection-settings?channelId={channelId}`
- **Auth gerekli mi:** Evet

**Request body (tüm alanlar opsiyonel):**
```json
{
  "autoBlockEnabled": true,
  "autoBanEnabled": false,
  "alertOnDetection": true,
  "riskScoreThreshold": 75,
  "maxMessagesPerMinute": 15
}
```

**Başarılı response (200):**
```json
{
  "success": true,
  "message": "Koruma ayarları başarıyla güncellendi.",
  "data": {
    "id": "uuid",
    "channelId": "uuid",
    "autoBlockEnabled": true,
    "autoBanEnabled": false,
    "alertOnDetection": true,
    "riskScoreThreshold": 75,
    "maxMessagesPerMinute": 15
  }
}
```

---

## 5. Log / Geçmiş Kayıtları

### Aktivite Geçmişi (Birleşik Log)
- **Method:** GET
- **URL:** `/api/activity-logs?channelId={channelId}&type={type}&page={page}&limit={limit}`
- **Auth gerekli mi:** Evet

**Query params:**
| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| channelId | Evet | Kanal UUID |
| type | Hayır | `ALERT`, `SUSPICIOUS_USER`, `RISK_SCORE`, `REPORT` |
| page | Hayır | Sayfa numarası (varsayılan: 1) |
| limit | Hayır | Sayfa başına kayıt (varsayılan: 20) |

**Başarılı response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "ALERT",
      "title": "SPAM_ATTACK",
      "description": "Kanalınızda yoğun spam saldırısı tespit edildi.",
      "severity": "HIGH",
      "createdAt": "2026-06-20T10:00:00.000Z",
      "metadata": {
        "isRead": false,
        "suspiciousUsername": "suspicious_bot",
        "resolvedAt": null
      }
    },
    {
      "id": "uuid",
      "type": "SUSPICIOUS_USER",
      "title": "Şüpheli kullanıcı: suspicious_bot",
      "description": "Aşırı hızlı mesaj gönderimi",
      "severity": "HIGH",
      "createdAt": "2026-06-19T08:00:00.000Z",
      "metadata": {
        "kickUserId": "kick-user-123",
        "username": "suspicious_bot",
        "status": "DETECTED",
        "tags": ["spam", "bot"]
      }
    }
  ],
  "meta": {
    "totalItems": 25,
    "itemCount": 20,
    "itemsPerPage": 20,
    "totalPages": 2,
    "currentPage": 1
  }
}
```

---

### Alarmlar
- **Method:** GET
- **URL:** `/api/alerts?channelId={channelId}&isRead={isRead}&limit={limit}`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "SPAM_ATTACK",
      "severity": "HIGH",
      "message": "Kanalınızda yoğun spam saldırısı tespit edildi.",
      "isRead": false,
      "createdAt": "2026-06-20T10:00:00.000Z",
      "suspiciousUser": {
        "id": "uuid",
        "username": "suspicious_bot",
        "severity": "HIGH"
      }
    }
  ]
}
```

---

### Alarmı Okundu İşaretle
- **Method:** PATCH
- **URL:** `/api/alerts/{id}/read`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "message": "Bildirim okundu olarak işaretlendi.",
  "data": {
    "id": "uuid",
    "isRead": true,
    "resolvedAt": "2026-06-20T11:00:00.000Z"
  }
}
```

---

### Raporlar
- **Method:** GET
- **URL:** `/api/reports?channelId={channelId}&period={period}`
- **Auth gerekli mi:** Evet

**Query params:**
| Parametre | Zorunlu | Açıklama |
|-----------|---------|----------|
| channelId | Evet | Kanal UUID |
| period | Hayır | `DAILY`, `WEEKLY`, `MONTHLY` |

**Başarılı response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "period": "WEEKLY",
      "startDate": "2026-06-13T00:00:00.000Z",
      "endDate": "2026-06-20T00:00:00.000Z",
      "summaryData": {
        "totalBotsDetected": 12,
        "totalAlerts": 8,
        "averageRiskScore": 65.4
      },
      "createdAt": "2026-06-20T00:00:00.000Z"
    }
  ]
}
```

> **Not:** Periyodik raporlar şu an veritabanına manuel veya seed script ile eklenir. Otomatik rapor üretimi (cron job) henüz bağlanmadı — frontend bu yapıya göre kodlamaya başlayabilir.

---

## 6. Profil / Yayıncı Bilgileri

### Profil Bilgilerini Getir
- **Method:** GET
- **URL:** `/api/auth/me`
- **Auth gerekli mi:** Evet

**Başarılı response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "yayinci@email.com",
    "displayName": "Yayıncı Adı",
    "avatarUrl": null,
    "role": "STREAMER",
    "createdAt": "2026-06-01T10:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z",
    "channelCount": 2,
    "channels": [
      {
        "id": "uuid",
        "kickChannelId": "my-kick-channel",
        "channelName": "Kanal Adı",
        "kickAvatarUrl": "https://kick.com/avatars/my-kick-channel.png",
        "isActive": true
      }
    ]
  }
}
```

---

### Profil Güncelle
- **Method:** PATCH
- **URL:** `/api/auth/me`
- **Auth gerekli mi:** Evet

**Request body:**
```json
{
  "displayName": "Yeni Görünür Ad",
  "avatarUrl": "https://example.com/avatar.png"
}
```

**Başarılı response (200):**
```json
{
  "success": true,
  "message": "Profil başarıyla güncellendi.",
  "data": {
    "id": "uuid",
    "email": "yayinci@email.com",
    "displayName": "Yeni Görünür Ad",
    "avatarUrl": "https://example.com/avatar.png",
    "role": "STREAMER"
  }
}
```

---

## Ek Endpoint'ler: Kanal Yönetimi

Frontend'in kanal seçimi ve yönetimi için kullanacağı endpoint'ler:

### Kanal Listesi
- **Method:** GET
- **URL:** `/api/channels`
- **Auth gerekli mi:** Evet

### Kanal Oluştur
- **Method:** POST
- **URL:** `/api/channels`
- **Auth gerekli mi:** Evet

**Request body:**
```json
{
  "kickChannelId": "kick-kanal-slug",
  "channelName": "Kanal Görünen Adı"
}
```

> **Not:** Kick API'si resmi olarak herkese açık olmadığı için takipçi sayısı ve avatar URL'si şu an mock (sahte) veri döndürür. Gerçek Kick API entegrasyonu tamamlandığında bu alanlar güncellenecektir.

### Kanal Güncelle
- **Method:** PUT
- **URL:** `/api/channels/{id}`

### Kanal Sil
- **Method:** DELETE
- **URL:** `/api/channels/{id}`

---

## Henüz Tam Hazır Olmayan Özellikler

| Özellik | Durum | Açıklama |
|---------|-------|----------|
| Kick API entegrasyonu | Mock | Kanal avatar ve takipçi sayısı sahte veri |
| Otomatik rapor üretimi | Manuel | Raporlar seed script veya manuel ekleme ile oluşturulur |
| Otomatik bot tespiti | Backend dışı | Şüpheli kullanıcı ve alarm kayıtları harici sistem tarafından POST ile eklenir |
| Token yenileme endpoint'i | Yok | Frontend Supabase client SDK ile `refreshToken` kullanabilir |

---

## Frontend Entegrasyon Örneği (JavaScript)

```javascript
const API_BASE = 'http://localhost:3000';

// Giriş
const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: '...', password: '...' }),
});
const { data: { accessToken, user } } = await loginRes.json();

// Dashboard verisi
const channelId = '...'; // GET /api/auth/me veya /api/channels'dan alınır
const dashRes = await fetch(
  `${API_BASE}/api/dashboard/summary?channelId=${channelId}`,
  { headers: { Authorization: `Bearer ${accessToken}` } },
);
const dashboard = await dashRes.json();
```

---

## Test Komutları

```bash
# Tüm endpoint'leri otomatik test et (24 test)
npm run test:e2e

# Demo veri ekle (önce kayıt/giriş yapılmış olmalı)
SEED_OWNER_EMAIL=you@email.com npx prisma db seed
```
