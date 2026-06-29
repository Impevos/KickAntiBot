import dummyData from '../dummy-data.json';
import type { DummyDataStore } from '../types/book';

const STORAGE_KEY = 'oku-getir-dummy-store';

/** Bellekte tutulan dummy veri — sepet/favori değişiklikleri oturum boyunca kalır */
function getStore(): DummyDataStore {
  if (typeof window === 'undefined') {
    return dummyData as DummyDataStore;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as DummyDataStore;
    } catch {
      // bozuk kayıt — varsayılana dön
    }
  }

  return structuredClone(dummyData) as DummyDataStore;
}

function saveStore(store: DummyDataStore): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }
}

export function getDummyStore(): DummyDataStore {
  return getStore();
}

export function updateDummyStore(updater: (store: DummyDataStore) => void): DummyDataStore {
  const store = getStore();
  updater(store);
  saveStore(store);
  return store;
}

/** Demo kullanıcı — gerçek auth gelene kadar sabit */
export const DEMO_USER_ID = 'u1000001-0000-4000-8000-000000000001';
