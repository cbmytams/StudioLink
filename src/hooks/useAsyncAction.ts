import { useCallback, useState } from 'react';

type AsyncOptions = {
  errorMessage?: string;
};

export function useAsyncAction<T, TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<T>,
  options?: AsyncOptions,
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<T | null> => {
      if (loading) return null;
      setLoading(true);
      setError(null);

      try {
        const result = await fn(...args);
        return result;
      } catch (err) {
        const message = err instanceof Error
          ? err.message
          : options?.errorMessage ?? 'Une erreur est survenue';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [fn, loading, options?.errorMessage],
  );

  return { execute, loading, error, setError };
}
