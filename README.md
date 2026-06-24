# Kick Anti-Bot Koruma Sistemi — Backend Servisi

Bu servis, Kick yayıncılarının kanallarındaki bot saldırılarını ve spamleri takip eden, Supabase Auth tabanlı çalışan NestJS backend uygulamasıdır.

## Kullanılan Teknolojiler

- **Node.js** v18 veya üzeri
- **NestJS** — Modüler backend framework
- **PostgreSQL / Supabase** — Veritabanı ve kimlik doğrulama
- **Prisma** — ORM

---

## Adım Adım Kurulum Rehberi

Aşağıdaki adımları sırayla takip ederek projeyi kendi bilgisayarınızda çalıştırabilirsiniz.

### 1. Gereksinimler

- [Node.js](https://nodejs.org/) (LTS sürümü önerilir)
- [Git](https://git-scm.com/)
- Bir [Supabase](https://supabase.com/) projesi (ücretsiz plan yeterli)

### 2. Projeyi Klonlayın

```bash
git clone https://github.com/Impevos/KickAntiBot.git
cd KickAntiBot
```

### 3. Bağımlılıkları Yükleyin

```bash
npm install
```

### 4. Çevre Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve Supabase bilgilerinizle doldurun:

```bash
cp .env.example .env
```

**Gerekli değişkenler:**

| Değişken | Nereden Alınır |
|----------|----------------|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string → **Transaction pooler** (port 6543) |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string → **Session pooler** (port 5432) |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public key |
| `JWT_SECRET` | Rastgele güvenli bir string (örn. `openssl rand -hex 32`) |
| `PORT` | Sunucu portu (varsayılan: 3000) |

> **Önemli:** Prisma şema işlemleri (`db push`, `migrate`) için hem `DATABASE_URL` hem `DIRECT_URL` gereklidir.

### 5. Veritabanını Hazırlayın

```bash
# Prisma istemcisini oluşturur
npx prisma generate

# Tabloları veritabanına yansıtır
npx prisma db push
```

### 6. (Opsiyonel) Demo Veri Ekleyin

Önce uygulamayı çalıştırıp `/api/auth/register` ile kayıt olun, ardından:

```bash
# Windows PowerShell
$env:SEED_OWNER_EMAIL="kayit-olunan-email@adres.com"; npx prisma db seed

# macOS / Linux
SEED_OWNER_EMAIL=kayit-olunan-email@adres.com npx prisma db seed
```

### 7. Uygulamayı Başlatın

```bash
# Geliştirme modu (hot reload)
npm run start:dev

# Üretim build
npm run build
npm run start:prod
```

Uygulama `http://localhost:3000` adresinde çalışır.

---

## Frontend Panel

React + TypeScript + Tailwind CSS ile geliştirilmiş yayıncı paneli `frontend/` klasöründedir.

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Panel `http://localhost:5173` adresinde çalışır. Detaylar için [frontend/README.md](./frontend/README.md) dosyasına bakın.

---

## API Dokümantasyonu

Frontend entegrasyonu için detaylı endpoint dokümantasyonu:

👉 **[API_DOCS.md](./API_DOCS.md)**

---

## Proje Klasör Yapısı

```
src/
├── auth/                 # Giriş, kayıt, profil
├── channels/             # Kick kanal yönetimi
├── suspicious-users/     # Şüpheli kullanıcı listesi (bot aktivite)
├── risk-scores/          # Risk skoru geçmişi
├── alerts/               # Güvenlik bildirimleri
├── reports/              # Periyodik raporlar + dashboard özeti
├── protection-settings/  # Kanal bazlı koruma ayarları
├── activity-logs/        # Birleşik geçmiş kayıtları
└── common/               # Prisma, filtreler, decorator'lar
```

---

## Test

```bash
# E2E API testleri (24 test, veritabanı bağlantısı gerektirir)
npm run test:e2e

# Backend build kontrolü
npm run build
```

### Backend + Frontend Birlikte Çalıştırma

İki ayrı terminal açın:

**Terminal 1 — Backend:**
```bash
npm run start:dev
# → http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
cp .env.example .env   # VITE_USE_MOCK_DATA=false olmalı
npm run dev
# → http://localhost:5173
```

Frontend geliştirme modunda `/api` isteklerini otomatik olarak `localhost:3000`'e yönlendirir (Vite proxy).

---

## Yararlı Komutlar

```bash
# Veritabanı şemasını görsel olarak incele
npx prisma studio

# Lint kontrolü
npm run lint
```

---

## Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| `PrismaClientInitializationError` | `.env` dosyasındaki `DATABASE_URL` ve `DIRECT_URL` değerlerini kontrol edin |
| `Supabase URL or Anon Key is missing` | `SUPABASE_URL` ve `SUPABASE_ANON_KEY` değerlerini kontrol edin |
| `Authorization başlığı eksik` (401) | İstek header'ına `Authorization: Bearer <token>` ekleyin |
| `email rate limit exceeded` | Supabase ücretsiz planda kayıt limiti vardır; birkaç dakika bekleyin |
| Port 3000 kullanımda | `.env` dosyasında `PORT=3001` gibi farklı bir port deneyin |

---

## Lisans

Bu proje özel kullanım içindir.
