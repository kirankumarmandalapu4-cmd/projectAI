'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

type ConnectionState = 'checking' | 'connected' | 'offline';

export const BackendStatus: React.FC = () => {
  const [state, setState] = useState<ConnectionState>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 4000);

      try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        if (!cancelled) setState(response.ok ? 'connected' : 'offline');
      } catch {
        if (!cancelled) setState('offline');
      } finally {
        window.clearTimeout(timeout);
      }
    };

    check();
    const interval = window.setInterval(check, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const config = {
    checking: {
      label: 'Checking API',
      className: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
      icon: <LoaderCircle className="w-3 h-3 animate-spin" />,
    },
    connected: {
      label: 'API connected',
      className: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    offline: {
      label: 'API offline',
      className: 'text-rose-400 border-rose-500/20 bg-rose-500/10',
      icon: <CircleAlert className="w-3 h-3" />,
    },
  }[state];

  return (
    <span
      title={`${config.label}: ${API_BASE_URL}`}
      className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold ${config.className}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
};
