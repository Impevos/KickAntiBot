# Kapatılan Güvenlik Açıkları

Bu dosya, incelemede bulunan her güvenlik açığını; **ne olduğunu**, **neden riskli olduğunu** ve **nasıl düzeltildiğini** sade bir dille açıklar.

---

## 1. 🔴 KRİTİK — Veritabanı şifresi GitHub'a sızdı

**Ne oldu?**
`.env` dosyası (içinde gerçek Supabase veritabanı şifresi, bağlantı adresi ve API anahtarı var) GitHub deposuna commit'lendi (`629d77a` numaralı commit). GitGuardian adlı güvenlik servisi bunu otomatik tespit edip uyarı maili gönderdi.

**Neden riskli?**
Bir şifre internete (private repo olsa bile) bir kez çıktığında "ifşa olmuş" sayılır:
- Repoya erişimi olan herkes (eski ekip üyeleri, yanlışlıkla davet edilenler) şifreyi görebilir.
- Şifre Git geçmişinde kalır; dosyayı silsen bile eski commit'lerde durur.
- Bu şifreyle veritabanına doğrudan bağlanıp tüm veriler okunabilir/silinebilir.

**Nasıl düzeltildi?**
- `.env` dosyası git takibinden çıkarıldı (`git rm --cached .env`) — yerel kopya korundu, repodaki kaldırıldı.
- `.gitignore` dosyasına `.env` geri eklendi; bundan sonra yanlışlıkla bile commit'lenemez.
- ⚠️ **Manuel adım gerekli:** Şifre zaten ifşa olduğu için **Supabase panelinden değiştirilmeli**. Kod tarafı kapatıldı ama bu adım kullanıcının yapması gereken bir işlem (rapor sonunda belirtildi).

> Not: Şifre commit geçmişinde (eski commit `629d77a`) hâlâ duruyor. Geçmişi tamamen temizlemek (history rewrite) paylaşılan repoda riskli olduğundan, asıl ve kesin çözüm **şifreyi değiştirmektir**.

---

## 2. 🟠 YÜKSEK — İstek sınırlama (rate limiting) yoktu

**Ne oldu?**
Hiçbir endpoint'te "dakikada en fazla X istek" gibi bir sınır yoktu. Özellikle giriş (`/auth/login`) ve kayıt (`/auth/register`) endpoint'leri sınırsız sayıda denemeye açıktı.

**Neden riskli?**
- **Brute-force:** Saldırgan, bir hesabın şifresini saniyede yüzlerce deneme yaparak kırmaya çalışabilir.
- **Spam kayıt:** Otomatik botlar binlerce sahte hesap oluşturabilir.
- Bu projenin amacı bot tespiti olduğundan, kendisinin bot saldırılarına açık olması ciddi bir çelişki.

**Nasıl düzeltildi?**
- `@nestjs/throttler` paketi eklendi.
- Tüm uygulamaya global sınır: IP başına 60 saniyede 100 istek.
- Giriş ve kayıt endpoint'lerine sıkı sınır: IP başına 60 saniyede **5 istek**.
- Test edildi: 6. istekte sistem `429 Too Many Requests` döndürüyor.

---

## 3. 🟡 ORTA — CORS tüm dünyaya açıktı

**Ne oldu?**
`app.enableCors()` filtresiz çağrılmıştı; yani **internetteki herhangi bir web sitesi** tarayıcı üzerinden bu API'ye istek atabilirdi.

**Neden riskli?**
Kötü niyetli bir site, giriş yapmış bir kullanıcının tarayıcısı üzerinden API'ye istek göndererek onun adına işlem yapmayı deneyebilir (cross-origin kötüye kullanımı).

**Nasıl düzeltildi?**
- CORS yalnızca belirli origin'lere açıldı.
- Origin listesi `CORS_ORIGIN` ortam değişkeninden okunuyor (virgülle birden fazla yazılabilir).
- Tanımsızsa geliştirme için varsayılan `http://localhost:5173` (frontend) ve `http://localhost:3000` kullanılıyor.
- `.env.example` dosyasına `CORS_ORIGIN` örneği eklendi.

---

## 4. 🟡 ORTA — Şifre politikası zayıftı

**Ne oldu?**
Kayıt sırasında şifre için yalnızca "en az 6 karakter" kontrolü vardı; karmaşıklık (büyük harf, rakam vb.) zorunlu değildi.

**Neden riskli?**
`123456` veya `password` gibi tahmin edilmesi kolay şifreler kabul ediliyordu; bu da hesapların ele geçirilmesini kolaylaştırır.

**Nasıl düzeltildi?**
- Kayıt şifresi artık **en az 8 karakter** olmalı ve **en az bir büyük harf, bir küçük harf ve bir rakam** içermeli.
- Maksimum 72 karakter sınırı eklendi (aşırı uzun girdiyle sistemi yormaya karşı).
- Giriş endpoint'inde bilinçli olarak yalnızca "dolu mu" kontrolü yapılıyor — politika değişse bile eski kullanıcıların girişi engellenmesin ve politika dışarı sızmasın diye.

---

## 5. 🟢 DÜŞÜK — Bilinmeyen alanlar sessizce kabul ediliyordu

**Ne oldu?**
Doğrulama (`ValidationPipe`) bilinmeyen fazladan alanları sessizce siliyordu ama hata vermiyordu.

**Neden riskli?**
Saldırgan, istek gövdesine `isAdmin: true` veya `role: "ADMIN"` gibi beklenmedik alanlar ekleyerek yetki yükseltmeyi deneyebilir. Sessiz silme, bu tür denemeleri fark etmeyi zorlaştırır.

**Nasıl düzeltildi?**
- `forbidNonWhitelisted: true` eklendi: DTO'da tanımlı olmayan bir alan gönderilirse istek doğrudan **400** ile reddediliyor.
- Test edildi: `{ "isAdmin": true, "role": "ADMIN" }` gibi fazladan alan içeren istek reddediliyor.

---

## 6. 🟢 DÜŞÜK — Kodda `console.log` kalmıştı

**Ne oldu?**
`main.ts` içinde bir adet `console.log` satırı vardı.

**Neden riskli?**
Tek başına büyük risk değil ama production'da yapılandırılmamış `console.log`'lar log yönetimini zorlaştırır ve ileride yanlışlıkla hassas bilgi yazdırılmasına zemin hazırlar.

**Nasıl düzeltildi?**
- NestJS'in kendi `Logger` sınıfıyla değiştirildi (`logger.log(...)`). Kalan tüm `src/` taraması yapıldı, başka `console.log` bulunmadı.

---

## Düzeltme Sonrası Doğrulama

- `npm run build` → hatasız
- `npm run test:e2e` → 24/24 geçti
- `scripts/security-test.ps1` → 8/8 geçti
