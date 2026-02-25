import { useState, useEffect } from 'react';
import type { Config } from '../types';

export function useConfig() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetch('/config/projects.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load config');
        }
        return res.json();
      })
      .then((data: Config) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { config, loading, error };
}
