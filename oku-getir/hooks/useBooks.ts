import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { getDummyStore } from '../lib/dummyStore';
import type { Book } from '../types/book';

function mapBook(row: Record<string, unknown>): Book {
  return {
    id: row.id as string,
    title: row.title as string,
    author: row.author as string,
    description: (row.description as string | null) ?? null,
    categoryId: (row.categoryId as string) ?? (row.category_id as string),
    category: row.category as string,
    categorySlug: (row.categorySlug as string) ?? (row.category_slug as string),
    image: (row.image as string | null) ?? null,
    condition: row.condition as Book['condition'],
    rentPrice: row.rentPrice != null ? Number(row.rentPrice) : null,
    salePrice: row.salePrice != null ? Number(row.salePrice) : null,
    isAvailable: Boolean(row.isAvailable ?? row.is_available ?? true),
    sellerName: (row.sellerName as string) ?? (row.seller_name as string),
    createdAt: (row.createdAt as string) ?? (row.created_at as string),
  };
}

/** Tüm kitapları getirir */
export async function getAllBooks(): Promise<Book[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('books_with_category')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapBook);
  }

  return getDummyStore().books;
}

/** Kategori slug'ına göre kitapları filtreler */
export async function getBooksByCategory(slug: string): Promise<Book[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('books_with_category')
      .select('*')
      .eq('categorySlug', slug)
      .order('createdAt', { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapBook);
  }

  return getDummyStore().books.filter((b) => b.categorySlug === slug);
}

/** Tek kitap detayı */
export async function getBookById(id: string): Promise<Book | null> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('books_with_category')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapBook(data) : null;
  }

  return getDummyStore().books.find((b) => b.id === id) ?? null;
}

/** React bileşenlerinde kullanım için hook */
export function useBooks(categorySlug?: string) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = categorySlug
        ? await getBooksByCategory(categorySlug)
        : await getAllBooks();
      setBooks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kitaplar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    load();
  }, [load]);

  return { books, loading, error, reload: load, usingSupabase: isSupabaseConfigured };
}
