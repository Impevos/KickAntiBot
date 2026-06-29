import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { DEMO_USER_ID, getDummyStore, updateDummyStore } from '../lib/dummyStore';
import type { Book, CartItem } from '../types/book';
import { getBookById } from './useBooks';

function mapCartItem(row: Record<string, unknown>): CartItem {
  return {
    id: row.id as string,
    userId: (row.userId as string) ?? (row.user_id as string),
    bookId: (row.bookId as string) ?? (row.book_id as string),
    quantity: Number(row.quantity ?? 1),
    addedAt: (row.addedAt as string) ?? (row.added_at as string),
  };
}

async function attachBooks(items: CartItem[]): Promise<CartItem[]> {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      book: (await getBookById(item.bookId)) ?? undefined,
    })),
  );
}

/** Kullanıcının sepetindeki ürünleri getirir */
export async function getCartItems(userId: string = DEMO_USER_ID): Promise<CartItem[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw new Error(error.message);
    return attachBooks((data ?? []).map(mapCartItem));
  }

  const items = getDummyStore().cartItems.filter((c) => c.userId === userId);
  return attachBooks(items);
}

/** Sepete kitap ekler (aynı kitap varsa quantity artırır) */
export async function addToCart(
  bookId: string,
  userId: string = DEMO_USER_ID,
): Promise<CartItem> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data: existing } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: Number(existing.quantity) + 1 })
        .eq('id', existing.id)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return mapCartItem(data);
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({ user_id: userId, book_id: bookId, quantity: 1 })
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapCartItem(data);
  }

  let created!: CartItem;
  updateDummyStore((store) => {
    const found = store.cartItems.find(
      (c) => c.userId === userId && c.bookId === bookId,
    );
    if (found) {
      found.quantity += 1;
      created = found;
      return;
    }
    created = {
      id: crypto.randomUUID(),
      userId,
      bookId,
      quantity: 1,
      addedAt: new Date().toISOString(),
    };
    store.cartItems.push(created);
  });
  return created;
}

/** Sepetten kitap çıkarır */
export async function removeFromCart(
  cartItemId: string,
  userId: string = DEMO_USER_ID,
): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return;
  }

  updateDummyStore((store) => {
    store.cartItems = store.cartItems.filter((c) => c.id !== cartItemId);
  });
}

/** React bileşenlerinde kullanım için hook */
export function useCart(userId: string = DEMO_USER_ID) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getCartItems(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sepet yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(
    async (bookId: string) => {
      await addToCart(bookId, userId);
      await load();
    },
    [userId, load],
  );

  const remove = useCallback(
    async (cartItemId: string) => {
      await removeFromCart(cartItemId, userId);
      await load();
    },
    [userId, load],
  );

  return {
    items,
    loading,
    error,
    addToCart: add,
    removeFromCart: remove,
    reload: load,
    usingSupabase: isSupabaseConfigured,
  };
}

export type { Book };
