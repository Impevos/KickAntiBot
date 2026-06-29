# Oku Getir — Backend & Veri Katmanı

İkinci el kitap kiralama/satış platformu **Oku Getir** için Supabase şeması, TypeScript tipleri ve veri erişim hook'ları.

---

## Veri modeli

| Tablo / View | Açıklama | Önemli alanlar |
|---|---|---|
| `categories` | Kitap kategorileri | `name`, `slug` (unique) |
| `users` | Kullanıcı profili | `id` (auth.users ile eşleşmeli), `email` (unique) |
| `books` | İlan edilen kitaplar | `rent_price`, `sale_price`, `condition`, `is_available` |
| `cart_items` | Sepet | `user_id` + `book_id` **unique** (aynı kitap iki kez eklenemez) |
| `favorites` | Favoriler | `user_id` + `book_id` **unique** |
| `books_with_category` | **VIEW** — join + camelCase | Frontend join yazmadan kitap + kategori bilgisi |

### İlişkiler

```
categories 1 ──< books
users      1 ──< cart_items >── books
users      1 ──< favorites  >── books
```

### Kitap durumu (`condition`)

| Değer | Anlam |
|---|---|
| `yeni` | Az kullanılmış / yeni gibi |
| `iyi` | Normal ikinci el |
| `orta` | Belirgin kullanım izleri |

---

## Dosya yapısı

```
oku-getir/
├── supabase-schema.sql    ← Supabase SQL Editor'e yapıştırılacak
├── dummy-data.json        ← Supabase yokken kullanılan örnek veri
├── types/book.ts          ← TypeScript interface'leri
├── lib/
│   ├── supabaseClient.ts  ← Supabase bağlantısı
│   └── dummyStore.ts      ← Dummy veri + localStorage
├── hooks/
│   ├── useBooks.ts
│   ├── useCategories.ts
│   ├── useCart.ts
│   └── useFavorites.ts
└── README-backend.md
```

---

## Supabase kurulum adımları

### 1. Supabase projesi oluştur

1. [supabase.com](https://supabase.com) → **New Project**
2. Proje adı: `oku-getir` (veya istediğin isim)
3. Database şifresini kaydet

### 2. SQL şemasını çalıştır

1. Supabase Dashboard → **SQL Editor** → **New query**
2. `supabase-schema.sql` dosyasının **tüm içeriğini** yapıştır
3. **Run** — tablolar, kategoriler ve view oluşur

### 3. Ortam değişkenlerini ayarla

React (Vite) projesinde `.env` dosyası:

```env
VITE_SUPABASE_URL=https://XXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Değerleri al: **Project Settings → API → Project URL** ve **anon public key**

> `.env` dosyasını GitHub'a **koyma** — `.gitignore`'a ekle.

### 4. Örnek kitap verisi ekle (opsiyonel)

SQL Editor'de birkaç kitap eklemek için `categories` tablosundan bir `category_id` alıp:

```sql
INSERT INTO books (title, author, description, category_id, condition, rent_price, sale_price, seller_name)
VALUES (
  'Suç ve Ceza',
  'Fyodor Dostoyevski',
  'Klasik Rus edebiyatı',
  (SELECT id FROM categories WHERE slug = 'roman'),
  'iyi',
  40, 110, 'Ayşe Y.'
);
```

---

## Hook kullanımı

### Kitaplar — `hooks/useBooks.ts`

```tsx
import { useBooks, getAllBooks, getBookById } from './hooks/useBooks';

// React bileşeninde
function BookList() {
  const { books, loading, error, usingSupabase } = useBooks();
  // categorySlug verirsen sadece o kategori gelir:
  // const { books } = useBooks('roman');

  if (loading) return <p>Yükleniyor...</p>;
  if (error) return <p>Hata: {error}</p>;

  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>{book.title} — {book.rentPrice}₺/ay</li>
      ))}
    </ul>
  );
}

// Bileşen dışında (async)
const all = await getAllBooks();
const book = await getBookById('b1000001-...');
```

### Kategoriler — `hooks/useCategories.ts`

```tsx
import { useCategories } from './hooks/useCategories';

function CategoryMenu() {
  const { categories, loading } = useCategories();
  return categories.map((c) => <a key={c.slug} href={`/kategori/${c.slug}`}>{c.name}</a>);
}
```

### Sepet — `hooks/useCart.ts`

```tsx
import { useCart } from './hooks/useCart';

function CartPage() {
  const { items, addToCart, removeFromCart, loading } = useCart();

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>
          {item.book?.title} x{item.quantity}
          <button onClick={() => removeFromCart(item.id)}>Kaldır</button>
        </div>
      ))}
    </div>
  );
}

// Başka bir yerden sepete ekle
await addToCart('b1000001-0000-4000-8000-000000000001');
```

### Favoriler — `hooks/useFavorites.ts`

```tsx
import { useFavorites } from './hooks/useFavorites';

function FavoriteButton({ bookId }: { bookId: string }) {
  const { isFavorite, addToFavorite, removeFromFavorite } = useFavorites();
  const fav = isFavorite(bookId);

  return (
    <button onClick={() => (fav ? removeFromFavorite(bookId) : addToFavorite(bookId))}>
      {fav ? '♥' : '♡'}
    </button>
  );
}
```

---

## Dummy mod vs Supabase mod

| Durum | Ne olur? |
|---|---|
| `.env` **yok** veya `VITE_SUPABASE_URL` boş | `dummy-data.json` okunur; sepet/favori değişiklikleri `localStorage`'da kalır |
| `.env` **dolu** | Otomatik Supabase'e geçer; `books_with_category` view kullanılır |

Hook'lardaki `usingSupabase: true/false` ile hangi modda olduğunu görebilirsin.

---

## Bağımlılık

React projene ekle:

```bash
npm install @supabase/supabase-js
```

`tsconfig.json` içinde JSON import için:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

---

## Sonraki adımlar (henüz yapılmadı)

- [ ] Supabase Auth ile gerçek giriş/kayıt
- [ ] RLS politikalarını açma (şema dosyasında yorum satırı olarak hazır)
- [ ] Kitap ilanı ekleme formu (INSERT books)
- [ ] Ödeme / kiralama süresi takibi
