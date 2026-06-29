import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient';
import { getDummyStore } from '../lib/dummyStore';
import type { Category } from '../types/book';

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    createdAt: (row.createdAt as string) ?? (row.created_at as string),
  };
}

/** Tüm kategorileri getirir */
export async function getAllCategories(): Promise<Category[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCategory);
  }

  return getDummyStore().categories;
}

/** React bileşenlerinde kullanım için hook */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getAllCategories());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { categories, loading, error, reload: load, usingSupabase: isSupabaseConfigured };
}
