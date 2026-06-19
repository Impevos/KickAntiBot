# Kick Anti-Bot Koruma Sistemi - Backend Servisi

Bu servis, Kick yayıncılarının kanallarındaki bot saldırılarını ve spamleri takip eden, Supabase Auth tabanlı çalışan NestJS backend uygulamasıdır.

## Kullanılan Teknolojiler
- **Node.js** (v18 veya üzeri)
- **NestJS** (Modüler Backend Framework)
- **PostgreSQL / Supabase** (Veritabanı ve Kimlik Doğrulama)
- **Prisma** (ORM - Veritabanı ve Kod Arasındaki Köprü)

---

## Adım Adım Kurulum Rehberi

Backend konusunda deneyimli olmasanız bile aşağıdaki adımları sırayla takip ederek projeyi bilgisayarınızda çalıştırabilirsiniz:

### 1. Gereksinimlerin Kurulması
Bilgisayarınızda şunların kurulu olduğundan emin olun:
- **Node.js**: [https://nodejs.org/](https://nodejs.org/) adresinden indirip kurabilirsiniz. (LTS sürümü tavsiye edilir)
- **Git**: Kod yönetimi için.

### 2. Bağımlılıkların Yüklenmesi
Terminal/Komut İstemi ekranını açın, proje klasörüne gidin ve şu komutu çalıştırarak gerekli tüm kütüphaneleri yükleyin:
```bash
npm install
```

### 3. Çevre Değişkenlerinin (.env) Ayarlanması
Proje klasöründeki `.env.example` dosyasının adını `.env` olarak değiştirin ve içeriğini kendinize göre düzenleyin:
- `DATABASE_URL`: Supabase projenizden aldığınız PostgreSQL bağlantı adresi.
- `SUPABASE_URL` ve `SUPABASE_ANON_KEY`: Supabase panelinizdeki API ayarlarından alınan bilgiler.
- `JWT_SECRET`: Güvenli, rastgele bir karakter dizisi yazabilirsiniz.

### 4. Veritabanının Hazırlanması (Prisma)
Veritabanı tablolarını Supabase üzerinde otomatik oluşturmak için sırasıyla şu komutları çalıştırın:
```bash
# Prisma istemcisini oluşturur
npx prisma generate

# Modelleri veritabanına yansıtır (Tabloları oluşturur)
npx prisma db push
```

### 5. Projenin Çalıştırılması
Projeyi geliştirme modunda (kodda değişiklik yaptıkça otomatik yenilenen mod) çalıştırmak için:
```bash
npm run start:dev
```
Uygulama varsayılan olarak `http://localhost:3000` portunda çalışmaya başlayacaktır.

---

## Proje Klasör Yapısı Hakkında Kısa Bilgi

- `prisma/schema.prisma`: Veritabanı tablolarımızı ve aralarındaki ilişkileri tanımladığımız yer.
- `src/main.ts`: Backend sunucumuzun çalışmaya başladığı ana giriş kapısı.
- `src/auth/`: Giriş/Kayıt ve şifre kontrol mekanizmalarını yönetir.
- `src/channels/`: Yayıncının takip ettiği Kick kanallarının yönetimini sağlar.
- `src/suspicious-users/`: Bot şüphesiyle işaretlenmiş kullanıcıları listeler.
- `src/alerts/`: Sistem tarafından yakalanan acil durum bildirimlerini tutar.
- `src/reports/`: Haftalık/günlük özet rapor verilerini tutar.
- `src/risk-scores/`: Kullanıcıların risk puanı geçmişini kaydeder.
