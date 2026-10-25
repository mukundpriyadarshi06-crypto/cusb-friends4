'use client';

import type { ReactNode } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function ConfigurationBoundary({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-xl px-6 py-24">
        <h1 className="text-3xl font-bold">Phygital Vault</h1>
        <p className="mt-4 text-slate-300">
          The vault is awaiting configuration. Please check back soon.
        </p>
      </main>
    );
  }

  return children;
}
