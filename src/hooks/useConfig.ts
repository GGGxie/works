import { useState, useEffect } from 'react';
import type { Config } from '../types';

// 预渲染会把配置内联进 HTML，命中时首屏无需再发请求
function readInlineConfig(): Config | null {
  if (typeof window === 'undefined') return null;
  return window.__CONFIG__ ?? null;
}

export function useConfig(initialConfig?: Config) {
  const initial = initialConfig ?? readInlineConfig();
  const [config, setConfig] = useState<Config | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (initial) return;

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
  }, [initial]);

  return { config, loading, error };
}
