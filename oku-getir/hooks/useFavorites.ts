import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { DEMO_USER_ID, getDummyStore, updateDummyStore } from '../lib/dummyStore';
import type { Favorite } from '../types/book';
import { getBookById } from './useBooks';

function mapFavorite(row: Record<string, unknown>): Favorite {
  return {
    id: row.id as string,
    userId: (row.userId as string) ?? (row.user_id as string),
    bookId: (row.bookId as string) ?? (row.book_id as string),
    addedAt: (row.addedAt as string) ?? (row.added_at as string),
  };
}

async function attachBooks(items: Favorite[]): Promise<Favorite[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      book: (await getBookById(item.bookId)) ?? undefined,
    })),
  );
}

/** Kullanıcının favori kitaplarını getirir */
export async function getFavorites(userId: string = DEMO_USER_ID): Promise<Favorite[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw new Error(error.message);
    return attachBooks((data ?? []).map(mapFavorite));
  }

  const items = getDummyStore().favorites.filter((f) => f.userId === userId);
  return attachBooks(items);
}

/** Favorilere ekler */
export async function addToFavorite(
  bookId: string,
  userId: string = DEMO_USER_ID,
): Promise<Favorite> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, book_id: bookId })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapFavorite(data);
  }

  let created!: Favorite;
  updateDummyStore((store) => {
    const exists = store.favorites.some(
      (f) => f.userId === userId && f.bookId === bookId,
    );
    if (exists) {
      created = store.favorites.find(
        (f) => f.userId === userId && f.bookId === bookId,
      )!;
      return;
    }
    created = {
      id: crypto.randomUUID(),
      userId,
      bookId,
      addedAt: new Date().toISOString(),
    };
    store.favorites.push(created);
  });
  return created;
}

/** Favorilerden çıkarır */
export async function removeFromFavorite(
  bookId: string,
  userId: string = DEMO_USER_ID,
): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (error) throw new Error(error.message);
    return;
  }

  updateDummyStore((store) => {
    store.favorites = store.favorites.filter(
      (f) => !(f.userId === userId && f.bookId === bookId),
    );
  });
}

/** React bileşenlerinde kullanım için hook */
export function useFavorites(userId: string = DEMO_USER_ID) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFavorites(await getFavorites(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Favoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (bookId: string) => {
      await addToFavorite(bookId, userId);
      await load();
    },
    [userId, load],
  );

  const remove = useCallback(
    async (bookId: string) => {
      await removeFromFavorite(bookId, userId);
      await load();
    },
    [userId, load],
  );

  const isFavorite = useCallback(
    (bookId: string) => favorites.some((f) => f.bookId === bookId),
    [favorites],
  );

  return {
    favorites,
    loading,
    error,
    addToFavorite: add,
    removeFromFavorite: remove,
    isFavorite,
    reload: load,
    usingSupabase: isSupabaseConfigured,
  };
}
