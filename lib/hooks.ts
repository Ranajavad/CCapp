import { useFocusEffect } from 'expo-router';
import { DependencyList, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tiny data-loading hook: runs `fn` whenever the screen gains focus (or deps
 * change) and exposes loading / error / refresh state.
 */
export function useData<T>(fn: () => Promise<T>, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    try {
      const result = await fnRef.current();
      if (alive.current) {
        setData(result);
        setError(null);
      }
    } catch (e: any) {
      if (alive.current) setError(e?.message ?? String(e));
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reload, ...deps]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    reload();
  }, [reload]);

  return { data, loading, refreshing, error, reload, refresh, setData };
}

export function useDebounced<T>(value: T, ms = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
