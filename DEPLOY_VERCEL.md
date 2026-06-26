# Vercel Canlı Deploy Rehberi

## Hızlı özet

Proje **frontend + backend** tek Vercel projesinde çalışacak şekilde ayarlandı:
- **Frontend:** `frontend/dist` (React/Vite)
- **Backend API:** `api/index.ts` (NestJS serverless) → `/api/*`

## 1. Vercel'e bağla

1. [vercel.com](https://vercel.com) → **Add New Project**
2. GitHub'dan **Impevos/KickAntiBot** reposunu seç
3. **Root Directory:** `.` (kök dizin — değiştirme)
4. Framework: **Other** (vercel.json kullanılıyor)

## 2. Ortam değişkenleri (Environment Variables)

Vercel proje ayarlarından **Production** için ekle:

| Değişken | Açıklama |
|----------|----------|
| `DATABASE_URL` | Supabase transaction pooler (6543) |
| `DIRECT_URL` | Supabase session pooler (5432) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `JWT_SECRET` | JWT secret |
| `CORS_ORIGIN` | Deploy sonrası Vercel URL (örn. `https://kick-anti-bot.vercel.app`) |
| `VITE_USE_MOCK_DATA` | `false` |
| `VITE_API_BASE_URL` | Boş bırak (aynı domain `/api` kullanılır) |

> Değerler yerel `.env` dosyandaki ile aynı. `CORS_ORIGIN` deploy URL'in olmalı.

## 3. Deploy

**Deploy** butonuna bas veya CLI ile:

```powershell
npx vercel login
npx vercel link
npx vercel env pull   # veya panelden env ekle
npx vercel deploy --prod
```

## 4. Test girişi

| Alan | Değer |
|------|-------|
| E-posta | `wtcn@gmail.com` |
| Şifre | `Test123!` |

Kullanıcı Supabase'de hazır; giriş çalışmalı.

## 5. Sorun giderme

- **401 giriş hatası:** Supabase'de e-posta doğrulama açıksa kullanıcıyı Supabase Auth panelinden onayla.
- **API 500:** Vercel → Deployments → Functions logs; `DATABASE_URL` ve `SUPABASE_*` env'leri kontrol et.
- **CORS hatası:** `CORS_ORIGIN` değerinin tam Vercel URL'i olduğundan emin ol (sonunda `/` olmasın).
