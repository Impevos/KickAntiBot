/** Kitap durumu: yeni / iyi / orta */
export type BookCondition = 'yeni' | 'iyi' | 'orta';

/** Kategori */
export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

/** Kullanıcı profili */
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

/**
 * Kitap — books_with_category view ve dummy-data ile aynı camelCase alanlar.
 * category + categorySlug join sonucu gelir.
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  categoryId: string;
  category: string;
  categorySlug: string;
  image: string | null;
  condition: BookCondition;
  rentPrice: number | null;
  salePrice: number | null;
  isAvailable: boolean;
  sellerName: string;
  createdAt: string;
}

/** Sepet satırı */
export interface CartItem {
  id: string;
  userId: string;
  bookId: string;
  quantity: number;
  addedAt: string;
  /** UI için opsiyonel: kitap detayı birlikte yüklenebilir */
  book?: Book;
}

/** Favori kaydı */
export interface Favorite {
  id: string;
  userId: string;
  bookId: string;
  addedAt: string;
  /** UI için opsiyonel */
  book?: Book;
}

/** dummy-data.json kök yapısı */
export interface DummyDataStore {
  categories: Category[];
  users: User[];
  books: Book[];
  cartItems: CartItem[];
  favorites: Favorite[];
}
