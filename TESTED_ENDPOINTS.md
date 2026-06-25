# Test Edilen Endpoint'ler — Güvenlik Senaryoları

Bu dosya, her endpoint için hangi güvenlik senaryolarının test edildiğini ve sonucunu listeler.

**Test araçları:**
- `npm run test:e2e` — 24 otomatik test (fonksiyonel + yetkilendirme)
- `scripts/security-test.ps1` — 8 canlı güvenlik senaryosu
- `scripts/integration-test.ps1` — uçtan uca akış

**Sonuç gösterimi:** ✅ beklenen davranış doğrulandı

---

## Genel (Tüm Korumalı Endpoint'ler)

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan erişim | 401 Unauthorized | ✅ |
| Geçersiz/sahte token ile erişim | 401 Unauthorized | ✅ |
| Başka kullanıcının verisine erişim (IDOR) | 403/404 | ✅ |
| DTO'da tanımsız fazladan alan (örn. `isAdmin`) | 400 Bad Request | ✅ |
| Global rate limit aşımı | 429 Too Many Requests | ✅ |
| Beklenmedik sunucu hatası | Sade mesaj, iç detay sızmıyor | ✅ |

---

## 1. Auth — `/api/auth/*`

### `POST /api/auth/register`
| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Geçersiz email formatı | 400 | ✅ |
| Şifre 8 karakterden kısa | 400 | ✅ |
| Şifre karmaşıklığı eksik (sadece harf) | 400 | ✅ |
| Bilinmeyen fazladan alan (`isAdmin`, `role`) | 400 | ✅ |
| Aynı email ile tekrar kayıt | 409 Conflict (sade mesaj) | ✅ |
| 60 sn içinde 5'ten fazla istek | 429 | ✅ |

### `POST /api/auth/login`
| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Boş gövde | 400 | ✅ |
| Eksik alan (sadece email) | 400 | ✅ |
| Yanlış şifre | 401 (sade mesaj, kullanıcı var/yok bilgisi sızmaz) | ✅ |
| 60 sn içinde 5'ten fazla deneme (brute-force) | 429 | ✅ |

### `POST /api/auth/logout` · `GET /api/auth/me` · `PATCH /api/auth/me`
| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| Geçerli token ile profil get/güncelle | 200 | ✅ |
| Profil yanıtında şifre/hash sızıntısı | Yok (Supabase auth, DB'de şifre tutulmuyor) | ✅ |

---

## 2. Channels — `/api/channels`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan listeleme | 401 | ✅ |
| Kendi kanalını oluştur/listele/güncelle/sil | 200/201 | ✅ |
| Başkasının kanalını getir/güncelle/sil (IDOR) | 403/404 | ✅ |
| Eksik/boş alan ile oluşturma | 400 | ✅ |

---

## 3. Suspicious Users — `/api/suspicious-users`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| `channelId` parametresiz listeleme | 400 | ✅ |
| Geçersiz UUID formatı (`channelId`) | 400 | ✅ |
| Başkasının kanalına şüpheli kullanıcı ekleme/görüntüleme | 403/404 | ✅ |
| Geçersiz `severity` enum değeri | 400 | ✅ |

---

## 4. Risk Scores — `/api/risk-scores`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| Skor aralığı dışında (0-100 dışı) | 400 | ✅ |
| Skor metin olarak gönderilirse (yanlış tip) | 400 | ✅ |
| Başkasının şüpheli kullanıcısına skor ekleme | 403/404 | ✅ |

---

## 5. Alerts — `/api/alerts`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| `channelId` parametresiz | 400 | ✅ |
| Başkasının kanalının alarmları | 403/404 | ✅ |
| Alarmı okundu işaretleme (kendi kanalı) | 200 | ✅ |

---

## 6. Reports & Dashboard — `/api/reports`, `/api/dashboard/summary`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| `channelId` parametresiz | 400 | ✅ |
| Başkasının kanalının raporları/özeti | 403/404 | ✅ |
| Dashboard özeti (kendi kanalı) | 200 | ✅ |

---

## 7. Protection Settings — `/api/protection-settings`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| `channelId` parametresiz | 400 | ✅ |
| Eşik değeri 0-100 dışında | 400 | ✅ |
| Başkasının kanal ayarlarını okuma/güncelleme | 403/404 | ✅ |

---

## 8. Activity Logs — `/api/activity-logs`

| Senaryo | Beklenen | Sonuç |
|---------|----------|-------|
| Token olmadan | 401 | ✅ |
| `channelId` parametresiz | 400 | ✅ |
| Başkasının kanal loglarına erişim | 403/404 | ✅ |

---

## Özet

| Kategori | Durum |
|----------|-------|
| Yetkisiz erişim koruması | Tüm endpoint'lerde ✅ |
| Sahiplik / IDOR koruması | Tüm endpoint'lerde ✅ |
| Girdi doğrulama (boş/yanlış tip/fazla alan) | Tüm endpoint'lerde ✅ |
| Rate limiting | Global + auth özel ✅ |
| Hata mesajlarında bilgi sızıntısı | Yok ✅ |
| Otomatik test (e2e) | 24/24 ✅ |
| Canlı güvenlik testi | 8/8 ✅ |
