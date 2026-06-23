# Kick Anti-Bot — Frontend Panel

React + TypeScript + Tailwind CSS ile geliştirilmiş yayıncı koruma paneli.

## Kurulum

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Panel `http://localhost:5173` adresinde çalışır. Backend `http://localhost:3000` üzerinde olmalıdır.

## Ortam Değişkenleri

| Değişken | Açıklama |
|----------|----------|
| `VITE_API_BASE_URL` | Backend API adresi. Geliştirmede boş bırakın (Vite proxy kullanır). |
| `VITE_USE_MOCK_DATA` | `true` ise backend olmadan mock veri kullanılır |

## Sayfalar

- `/login` — Giriş
- `/register` — Kayıt
- `/dashboard` — Ana panel
- `/bot-activity` — Şüpheli kullanıcı listesi
- `/protection` — Koruma ayarları
- `/logs` — Aktivite geçmişi
- `/profile` — Profil ve kanal bilgileri

## API Entegrasyonu

Tüm servisler `src/services/api-services.ts` içindedir. `VITE_USE_MOCK_DATA=true` iken API hatalarında mock veriye düşer; `false` iken gerçek hatalar ekranda gösterilir.

Detaylı endpoint dokümantasyonu için kök dizindeki [API_DOCS.md](../API_DOCS.md) dosyasına bakın.
