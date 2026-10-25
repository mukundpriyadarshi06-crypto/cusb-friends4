'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Zap, Wallet, Layers } from 'lucide-react';

interface LeaderboardRow {
  id: string;
  username: string;
  wallet_balance: number;
  card_count: number;
  total_power: number;
  portfolio_value: number;
  net_worth: number;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    const [{ data: profiles }, { data: cards }] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('cards').select('*').eq('is_claimed', true),
    ]);

    if (profiles) {
      const computed: LeaderboardRow[] = profiles.map((p: any) => {
        const owned = (cards || []).filter((c: any) => c.owner_id === p.id);
        const totalPower = owned.reduce((acc: number, c: any) => acc + Number(c.power_score), 0);
        const portfolioValue = owned.reduce((acc: number, c: any) => acc + Number(c.market_value), 0);
        const wallet = Number(p.wallet_balance);
        return {
          id: p.id,
          username: p.username || `Collector_${p.id.slice(0, 5)}`,
          wallet_balance: wallet,
          card_count: owned.length,
          total_power: totalPower,
          portfolio_value: portfolioValue,
          net_worth: wallet + portfolioValue,
        };
      });

      computed.sort((a, b) => b.total_power - a.total_power || b.net_worth - a.net_worth);
      setRows(computed);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center space-x-3">
          <Trophy className="w-8 h-8 text-amber-400" />
          <span>Global Collector Leaderboard</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Ranked by Total Deck Power Score and Combined Vault Net Worth.
        </p>
      </div>

      {loading ? (
        <div className="text-slate-400 py-16 text-center">Calculating rankings...</div>
      ) : rows.length === 0 ? (
        <div className="p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-400">
          No collectors registered yet. Sign up to claim the #1 spot!
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-950/60">
                <th className="py-4 px-6">Rank</th>
                <th className="py-4 px-6">Collector Handle</th>
                <th className="py-4 px-6">Cards Claimed</th>
                <th className="py-4 px-6">Total Power Score</th>
                <th className="py-4 px-6">Vault Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {rows.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-6 font-black text-lg">
                    {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                  </td>
                  <td className="py-4 px-6 font-bold text-white">{r.username}</td>
                  <td className="py-4 px-6 text-slate-300">
                    <span className="inline-flex items-center space-x-1">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>{r.card_count}</span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center space-x-1 font-extrabold text-amber-400">
                      <Zap className="w-4 h-4" />
                      <span>{r.total_power.toLocaleString()} PWR</span>
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center space-x-1 font-bold text-emerald-400">
                      <Wallet className="w-4 h-4" />
                      <span>${r.net_worth.toLocaleString()}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
