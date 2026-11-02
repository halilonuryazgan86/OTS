import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { errorMessage } from './api';

// Ekran her odaklandığında veriyi yeniden yükler (detay ekranından dönünce liste güncel olur).
export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { data, setData, loading, refreshing, error, reload: load, refresh: () => load('refresh') };
}
