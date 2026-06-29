-- ============================================================
-- Oku Getir — Supabase Veritabanı Şeması
-- Bu dosyayı Supabase Dashboard → SQL Editor'e yapıştırıp çalıştırın.
-- ============================================================

-- UUID üretimi için (Supabase'de genelde zaten açıktır)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. CATEGORIES (Kategoriler)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Başlangıç kategorileri
INSERT INTO public.categories (name, slug) VALUES
  ('Roman', 'roman'),
  ('Kişisel Gelişim', 'kisisel-gelisim'),
  ('Üniversite Kitapları', 'universite-kitaplari'),
  ('Lise Ders Kitapları', 'lise-ders-kitaplari'),
  ('Yazılım ve Teknoloji', 'yazilim-ve-teknoloji'),
  ('Çocuk Kitapları', 'cocuk-kitaplari'),
  ('Sınav Hazırlık', 'sinav-hazirlik'),
  ('Akademik Kitaplar', 'akademik-kitaplar')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- 2. USERS (Kullanıcı profilleri)
-- Not: Supabase Auth ayrıca auth.users tutar. Bu tablo uygulama
-- profili içindir; id değeri auth.users.id ile eşleşmelidir.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. BOOKS (Kitaplar)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.books (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  author       TEXT NOT NULL,
  description  TEXT,
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  image        TEXT,
  condition    TEXT NOT NULL CHECK (condition IN ('yeni', 'iyi', 'orta')),
  rent_price   NUMERIC(10, 2),
  sale_price   NUMERIC(10, 2),
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  seller_name  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT books_at_least_one_price CHECK (
    rent_price IS NOT NULL OR sale_price IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_books_category_id ON public.books(category_id);
CREATE INDEX IF NOT EXISTS idx_books_is_available ON public.books(is_available);

-- ------------------------------------------------------------
-- 4. CART_ITEMS (Sepet)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id  UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

-- ------------------------------------------------------------
-- 5. FAVORITES (Favoriler)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id  UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- ------------------------------------------------------------
-- 6. VIEW: books_with_category
-- Frontend'in join yazmasına gerek kalmadan camelCase alanlar döner.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.books_with_category AS
SELECT
  b.id,
  b.title,
  b.author,
  b.description,
  b.category_id AS "categoryId",
  b.image,
  b.condition,
  b.rent_price  AS "rentPrice",
  b.sale_price  AS "salePrice",
  b.is_available AS "isAvailable",
  b.seller_name AS "sellerName",
  b.created_at  AS "createdAt",
  c.name        AS category,
  c.slug        AS "categorySlug"
FROM public.books b
JOIN public.categories c ON c.id = b.category_id;

-- ------------------------------------------------------------
-- 7. RLS (Row Level Security) — Şimdilik KAPALI
-- Auth stratejisi netleşince aşağıdaki yorumları kaldırıp uygulayın.
-- ------------------------------------------------------------

-- ALTER TABLE public.users       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.books       ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cart_items  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.favorites   ENABLE ROW LEVEL SECURITY;
-- categories genelde herkese açık okunabilir:
-- ALTER TABLE public.categories  ENABLE ROW LEVEL SECURITY;

-- -- Kategoriler: herkes okuyabilir
-- CREATE POLICY "categories_select_public"
--   ON public.categories FOR SELECT
--   USING (true);

-- -- Kitaplar: herkes okuyabilir, sadece satıcı ekleyebilir/güncelleyebilir
-- CREATE POLICY "books_select_public"
--   ON public.books FOR SELECT
--   USING (true);
-- CREATE POLICY "books_insert_authenticated"
--   ON public.books FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);
-- CREATE POLICY "books_update_owner"
--   ON public.books FOR UPDATE
--   USING (seller_name = (SELECT name FROM public.users WHERE id = auth.uid()));

-- -- Sepet: kullanıcı sadece kendi sepetini görür/yönetir
-- CREATE POLICY "cart_select_own"
--   ON public.cart_items FOR SELECT
--   USING (user_id = auth.uid());
-- CREATE POLICY "cart_insert_own"
--   ON public.cart_items FOR INSERT
--   WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "cart_update_own"
--   ON public.cart_items FOR UPDATE
--   USING (user_id = auth.uid());
-- CREATE POLICY "cart_delete_own"
--   ON public.cart_items FOR DELETE
--   USING (user_id = auth.uid());

-- -- Favoriler: kullanıcı sadece kendi favorilerini görür/yönetir
-- CREATE POLICY "favorites_select_own"
--   ON public.favorites FOR SELECT
--   USING (user_id = auth.uid());
-- CREATE POLICY "favorites_insert_own"
--   ON public.favorites FOR INSERT
--   WITH CHECK (user_id = auth.uid());
-- CREATE POLICY "favorites_delete_own"
--   ON public.favorites FOR DELETE
--   USING (user_id = auth.uid());

-- -- Kullanıcı profili: kendi kaydını okuyup güncelleyebilir
-- CREATE POLICY "users_select_own"
--   ON public.users FOR SELECT
--   USING (id = auth.uid());
-- CREATE POLICY "users_update_own"
--   ON public.users FOR UPDATE
--   USING (id = auth.uid());
