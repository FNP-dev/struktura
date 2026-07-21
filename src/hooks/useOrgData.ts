import { useEffect, useState, useCallback } from 'react';
import { fetchOrgSnapshot, type OrgSnapshot } from '../lib/api';

interface UseOrgDataResult {
  data: OrgSnapshot | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useOrgData(): UseOrgDataResult {
  const [data, setData] = useState<OrgSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchOrgSnapshot()
      .then((snapshot) => setData(snapshot))
      .catch((err: unknown) => {
        const msg =
          (err && typeof err === 'object' && 'message' in err && (err as { message: string }).message) ||
          (typeof err === 'string' && err) ||
          'Nieznany błąd';
        setError(String(msg));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
