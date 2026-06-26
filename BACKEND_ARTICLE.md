# Kick Anti Bot Projesinde Backend Süreci ve Öğrendiklerim

**Yazar:** Mustafa Eren Kabaca  
**Rol:** Backend Geliştirici  
**Tarih:** 26 Haziran 2026  

---

## Giriş

Bu makalede, bir süredir üzerinde çalıştığımız ve artık bitiş aşamasına getirdiğimiz **Kick Anti Bot** projesinin backend geliştirme sürecini, karşılaştığım teknik zorlukları, geliştirdiğimiz çözümleri ve bu süreçte edindiğim kazanımları detaylı bir şekilde ele alacağım. Projeyi geliştirirken yapay zeka kodlama asistanımla yakın bir iş birliği içinde çalışarak hem hızlı prototipleme hem de ileri seviye güvenlik sertleştirme adımlarını başarıyla uyguladık.

---

## 1. Kick Anti Bot Projesinin Amacı Nedir?

Günümüzde canlı yayın platformları (özellikle son dönemde hızla büyüyen Kick.com), bot saldırıları (follow-bot, chat-bot), spam mesajlar ve yayıncıların sohbet düzenini bozan organize taciz dalgalarıyla sıkça karşılaşmaktadır. Bu tür saldırılar hem yayıncının motivasyonunu düşürmekte hem de platformun teknik altyapısını zorlamaktadır.

**Kick Anti Bot** projesinin temel amacı; Kick yayıncılarının kanallarını gerçek zamanlı olarak bot saldırılarına karşı korumak, şüpheli kullanıcı aktivitelerini analiz etmek ve yayıncılara kanallarındaki risk durumunu gösteren kapsamlı bir kontrol paneli (dashboard) sunmaktır. Backend servisi bu amaç doğrultusunda:
- Yayıncıların kanallarını ve bu kanallara ait koruma ayarlarını (otomatik banlama, otomatik engelleme vb.) yönetmeyi,
- Sisteme düşen şüpheli kullanıcı verilerini, risk skorlarını ve geçmiş logları tutarlı bir veritabanı şemasında depolamayı,
- Güvenlik ihlallerinde anlık alarmlar üreterek frontend paneline iletmeyi sağlar.

---

## 2. Backend Tarafında Hangi Görevleri Yaptım?

Projenin backend mimarisinin sıfırdan kurulmasından, veri güvenliğinin en üst seviyeye çıkarılmasına kadar geniş bir yelpazede sorumluluk aldım. Gerçekleştirdiğim başlıca görevler şunlardır:

1. **Mimarinin ve Proje Klasör Yapısının Kurulması:** NestJS framework'ünü modüler bir yapıda kurarak kodun okunabilirliğini ve sürdürülebilirliğini artırdım.
2. **Veritabanı Modelleme (Schema Design):** PostgreSQL veritabanı üzerinde kullanıcılar, kanallar, şüpheli hesaplar, risk skorları, alarmlar ve koruma ayarları arasındaki ilişkileri belirleyen kapsamlı bir Prisma şeması tasarladım.
3. **Kimlik Doğrulama Köprüsü (Auth Bridge):** Supabase Auth entegrasyonunu gerçekleştirerek NestJS üzerinde özel bir `JwtAuthGuard` geliştirdim. Bu sayede, dış kimlik sağlayıcı (Supabase) ile yerel PostgreSQL veritabanımız arasındaki kullanıcı profili senkronizasyonunu sağladım.
4. **API Endpoint'lerinin Hazırlanması:** Mobil/web frontend uygulamasının ihtiyaç duyduğu tüm RESTful API endpoint'lerini tasarladım, dokümante ettim ve geliştirdim.
5. **Güvenlik Sertleştirmesi (Security Hardening):** CORS ayarları, IP bazlı istek sınırlama (rate limiting), SQL Injection ve format doğrulamaları gibi güvenlik mekanizmalarını entegre ettim.
6. **E2E ve Entegrasyon Testleri:** Geliştirdiğim endpoint'lerin kararlılığını ölçmek amacıyla Jest ve Supertest kütüphanelerini kullanarak 24 adet End-to-End (E2E) test senaryosu hazırladım ve başarıyla çalıştırdım.

---

## 3. Hangi Teknolojileri Kullandım?

Projeyi modern, modüler ve güvenli bir teknoloji yığını üzerine inşa ettim:

- **Node.js & NestJS:** Backend'in ana omurgası olarak TypeScript destekli, modüler ve kurumsal düzeyde bir framework olan NestJS'i tercih ettim. NestJS'in dependency injection ve boru hattı (pipe) mimarisi işimizi son derece kolaylaştırdı.
- **PostgreSQL & Supabase:** Veritabanı olarak ilişkisel veri yapısına tam uyum sağlayan PostgreSQL'i kullandık. Supabase bulut altyapısı sayesinde veritabanı sunucusunu sıfırdan yönetmek yerine hızlıca bağlantı havuzları (Transaction & Session Pooler) kurduk.
- **Prisma ORM:** Tip güvenliği (type-safety) ve hızlı sorgu yazımı amacıyla Prisma kullandım. Şema değişikliklerini veritabanına yansıtmak (`prisma db push`) ve istemci kodlarını üretmek (`prisma generate`) süreçlerimizi hızlandırdı.
- **Supabase Auth:** Kullanıcı kayıt, giriş ve şifre yönetim süreçlerini güvenli bir şekilde Supabase altyapısına delege ettim.
- **@nestjs/throttler:** Brute-force ve DDoS benzeri spam istekleri engellemek için rate-limiting paketi olarak kullandım.
- **class-validator & class-transformer:** Request gövdelerinin (body) ve query parametrelerinin veri tiplerini çalışma zamanında (runtime) doğrulamak için entegre ettim.

---

## 4. API Endpoint'leri Nasıl Hazırlanması ve Yapısı

API tasarımlarımızı yaparken tutarlılık ve frontend entegrasyon kolaylığı ana odağımız oldu. Tüm endpoint'ler `/api` ön ekiyle başlayacak şekilde NestJS denetleyicileri (controllers) aracılığıyla yapılandırıldı.

### İstek ve Yanıt Standartları
Tüm API yanıtları için standart bir JSON yapısı belirledim. Başarılı yanıtlar:
```json
{
  "success": true,
  "data": { ... },
  "message": "İşlem başarılı açıklaması"
}
```
Hata durumlarında ise frontend ekibinin hatayı kolayca yorumlayabilmesi için şu formatı kullandım:
```json
{
  "success": false,
  "error": {
    "statusCode": 400,
    "message": "Hata açıklaması"
  }
}
```

### Ana Endpoint Grupları:
- **Kimlik Doğrulama (`/api/auth`):** Kayıt (`/register`), Giriş (`/login`), Çıkış (`/logout`) ve Profil (`/me`) işlemleri.
- **Kanal Yönetimi (`/api/channels`):** Yayıncıların Kick kanallarını eklemesi, listelemesi, güncellemesi veya silmesi (CRUD).
- **Dashboard ve Raporlama (`/api/dashboard`, `/api/reports`):** Kanal bazlı istatistik özetleri ve periyodik bot raporları.
- **Bot/Spam Takibi (`/api/suspicious-users`, `/api/risk-scores`):** Şüpheli bot hesaplarının detayları ve zaman içindeki risk skoru değişim geçmişi.
- **Güvenlik Ayarları ve Alarmlar (`/api/protection-settings`, `/api/alerts`):** Kanal bazlı otomatik koruma kuralları ve sistemin ürettiği anlık uyarılar.

---

## 5. Frontend ile Backend Bağlantısı İçin Nasıl Bir Yapı Kuruldu?

Frontend ve backend bağlantısında hem verimliliği hem de güvenliği gözeten çift katmanlı bir mimari kurduk:

1. **Vite Proxy ve CORS Entegrasyonu:** Geliştirme aşamasında tarayıcıların "Same-Origin Policy" engeline takılmamak için frontend tarafında (Vite) istekleri `/api` üzerinden backend sunucusuna (`http://localhost:3000`) yönlendiren bir proxy yapısı kurduk. Backend tarafında ise CORS ayarlarını sıkılaştırarak yalnızca izin verilen origin'lerden (`CORS_ORIGIN`) gelen istekleri kabul ettik.
2. **Eksenel Token Tabanlı Yetkilendirme (JWT):** Kullanıcı giriş yaptıktan sonra backend'den dönen `accessToken` değerini frontend tarafında `localStorage` üzerinde sakladık. Axios interceptors (ara katman) yardımıyla, her istekte HTTP `Authorization: Bearer <token>` başlığı otomatik olarak backend'e iletildi.
3. **Mock Data ve Canlı Entegrasyon Esnekliği:** Geliştirme sürecinde frontend ekibinin backend'den bağımsız çalışabilmesi için çift yönlü bir yapı hazırladık. Frontend tarafındaki `VITE_USE_MOCK_DATA` ortam değişkeni sayesinde, backend kapalıyken bile mock verilerle testler yapılabildi; backend ayağa kalktığında ise tek bir parametreyle canlı API isteklerine geçiş sağlandı.

---

## 6. Backend Güvenliği Tarafında Nelere Dikkat Ettim?

Bir güvenlik projesi geliştirdiğimiz için kendi API'lerimizin de siber saldırılara karşı son derece dayanıklı olması gerekiyordu. Güvenlik tarafında uyguladığım kritik sertleştirme önlemleri şunlardır:

- **Hassas Veri İfşasının Engellenmesi (.env Koruması):** Veritabanı bağlantı bilgilerini içeren `.env` dosyasının yanlışlıkla repoya commit'lendiği bir durumu erkenden fark ederek dosyayı Git geçmişinden çıkardım ve `.gitignore` dosyasına ekledim.
- **Hız Sınırlama (Rate Limiting):** Tüm sisteme dakikada maksimum 100 istek sınırı koyarken; brute-force saldırılarına en açık olan `/api/auth/login` ve `/api/auth/register` endpoint'lerine IP başına **dakikada en fazla 5 istek** limiti getirdim.
- **Giriş Filtreleme ve Whitelisting:** DTO (Data Transfer Object) tanımlamalarında `whitelist: true` ve `forbidNonWhitelisted: true` seçeneklerini aktif ettim. Böylece saldırganların istek gövdesine ekstradan `isAdmin: true` veya `role: "ADMIN"` gibi parametreler ekleyerek yetki yükseltme (privilege escalation) denemeleri yapmasını engelledim.
- **UUID Format ve Tip Koruması:** Dinamik route parametrelerinde (örn: `/api/channels/:id`) veritabanı seviyesine inmeden önce NestJS `ParseUUIDPipe` kullanarak parametrenin geçerli bir UUID v4 formatında olduğunu doğruladım. Böylece geçersiz biçimli verilerle veritabanı kütüphanesinin çökmesini veya SQL injection benzeri riskleri önledim.

---

## 7. Yetkilendirme, Veri Kontrolü ve Hata Yönetiminde Öğrendiklerim

Bu proje, teorik güvenlik bilgilerimi pratik bir projede uygulamak adına bana harika deneyimler sundu:

- **IDOR (Insecure Direct Object Reference) Koruması:** Bir kullanıcının sadece kendi verilerine erişebilmesi gerektiğini (Yetkilendirme / Sahiplik Kontrolü) çok daha iyi kavradım. Her veritabanı sorgusunda `ownerId` veya `channelId` üzerinden sahiplik doğrulaması (`verifyChannelOwnership`) yaparak, yetkisiz kullanıcıların başkalarına ait kanalların koruma ayarlarını değiştirmesini veya raporlarını okumasını kesin olarak engelledim.
- **Hata Yakalama ve Loglama (HttpExceptionFilter):** Hata mesajlarında stack trace (hata izi) veya ham SQL sorgu hatalarının istemciye dönmesinin ciddi bir bilgi sızıntısı (information disclosure) olduğunu öğrendim. Backend'de global bir filtre yazarak tüm hataları yakaladım; detayları sunucu loglarına kaydederken, kullanıcıya sadece sade ve anlamlı hata mesajları döndüm.
- **Veri Senkronizasyonu (Orphan Record Önleme):** Dış kimlik sağlayıcı (Supabase Auth) ile yerel veritabanımız (PostgreSQL) arasındaki olası uyumsuzlukları gidermek için kayıt öncesinde yerel veritabanında email varlığı kontrolünü zorunlu kıldım. Bu sayede Supabase tarafında başarıyla açılıp yerel tarafta çakışan yetim (orphan) kayıt oluşmasının önüne geçtim.

---

## 8. Karşılaştığım Sorunlar ve Çözümlerim

Geliştirme sürecinde karşılaştığım en büyük zorluklar ve bunları çözme yöntemlerim şunlardı:

1. **Sorun: Veritabanı Şifresinin Git'e Commit Edilmesi**
   - *Açıklama:* Projenin ilk aşamalarında `.env` dosyası yanlışlıkla commit'lenmişti. GitGuardian uyarısıyla durumu fark ettim.
   - *Çözüm:* `.env` dosyasını `git rm --cached` ile repodan çıkarıp `.gitignore`'a ekledim. Ancak kalıcı güvenlik için veritabanı şifresini Supabase paneli üzerinden tamamen sıfırlayarak yeniledim.
2. **Sorun: Supabase UUID Eşleşmelerindeki Çakışmalar**
   - *Açıklama:* Supabase Auth üzerinden silinen bir kullanıcının yerel PostgreSQL tablosunda eski UUID'si kalıyor ve aynı e-postayla tekrar kaydolmaya çalıştığında benzersiz alan (unique email) kısıtlaması nedeniyle Prisma hatası veriyordu.
   - *Çözüm:* `AuthService.syncLocalUser` metodu içinde, eğer veritabanında aynı e-postaya sahip fakat UUID'si farklı eski bir kayıt bulunuyorsa bu eski kaydı silip yenisini oluşturan bir mantık kurarak veri tutarlılığını sağladım.
3. **Sorun: Dinamik URL Parametrelerindeki Geçersiz İstekler**
   - *Açıklama:* `/api/alerts/:id` gibi endpoint'lerde `:id` kısmına rastgele string yazıldığında Prisma veritabanı düzeyinde UUID dönüştürme hatası veriyor ve sunucu 500 dahili hata dönüyordu.
   - *Çözüm:* Tüm bu endpoint'lerin parametre tanımlarına NestJS `ParseUUIDPipe` ekleyerek geçersiz formatları daha controller katmanında 400 Bad Request hatasıyla reddettim.

---

## 9. Bu Projeden Sonra Backend Tarafında Kendimi Hangi Alanlarda Geliştirmek İstiyorum?

Kick Anti Bot backend sürecini başarıyla tamamlamak, bana yeni öğrenme kapıları açtı. Önümüzdeki dönemde kendimi geliştirmek istediğim alanlar şunlardır:

1. **Real-time İletişim (WebSockets / SSE):** Projede şüpheli bot tespit edildiğinde alarmlar şu an REST API ile çekiliyor. Bunu WebSocket (NestJS WebSockets/Socket.io) veya Server-Sent Events (SSE) mimarisine taşıyarak anlık (real-time) alarm uyarıları göndermeyi öğrenmek ve uygulamak istiyorum.
2. **Mikroservis Mimarisi:** Bot tespiti yapan harici analiz motorları ile API sunucusunu birbirinden ayırıp aralarındaki iletişimi RabbitMQ veya Apache Kafka gibi mesaj kuyrukları (Message Brokers) üzerinden yöneten asenkron mikroservis yapılarını deneyimlemek istiyorum.
3. **Redis Caching:** Sıkça sorgulanan dashboard özetleri ve şüpheli kullanıcı listeleri gibi verileri önbelleğe (cache) alarak veritabanı yükünü azaltmak ve API yanıt sürelerini milisaniyeler seviyesine indirmek için Redis entegrasyonu üzerinde çalışmayı planlıyorum.

---

## Sonuç

Kick Anti Bot projesi, backend mimarisi tasarımı ve veri güvenliği konularında kendimi geliştirmem için mükemmel bir fırsat oldu. Güvenlik açıklarını kapatmak, rate limiting uygulamak, veri doğrulama filtreleri oluşturmak ve kapsamlı test süreçleri yürütmek bana bir backend geliştirici olarak çok yönlü düşünme yeteneği kazandırdı. Yapay zeka asistanımla yaptığım verimli iş birliği sayesinde temiz, güvenli ve sürdürülebilir bir backend ürünü ortaya çıkardık.

Destek veren ve süreci takip eden tüm ekip arkadaşlarıma teşekkür ederim!
