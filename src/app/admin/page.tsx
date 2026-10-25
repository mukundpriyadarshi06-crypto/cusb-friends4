'use client';

import React, { useEffect, useState } from 'react';
import {
  supabase,
  CARD_CATEGORIES,
  CardCategory,
  CardRarity,
  CardItem,
} from '@/lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import { ShieldCheck, PlusCircle, Copy, Check, RefreshCw, Lock } from 'lucide-react';

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<CardCategory>('Pokémon');
  const [rarity, setRarity] = useState<CardRarity>('Rare');
  const [powerScore, setPowerScore] = useState(850);
  const [marketValue, setMarketValue] = useState(250);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  );
  const [claimCode, setClaimCode] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintMessage, setMintMessage] = useState('');

  const [cards, setCards] = useState<CardItem[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'HACKATHON2026ADM';

  useEffect(() => {
    generateRandomCode('Pokémon');
    fetchAllCards();
  }, []);

  function generateRandomCode(cat: string) {
    const prefix = cat.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CRD';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setClaimCode(`${prefix}-MINT-${rand}`);
  }

  async function fetchAllCards() {
    const { data } = await supabase
      .from('cards')
      .select('*, owner:profiles(username)')
      .order('created_at', { ascending: false });
    if (data) setCards(data as any);
  }

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === ADMIN_PASS) {
      setIsUnlocked(true);
      setAuthError('');
    } else {
      setAuthError('Invalid Admin Password. Try HACKATHON2026ADM');
    }
  }

  async function handleMintCard(e: React.FormEvent) {
    e.preventDefault();
    setMinting(true);
    setMintMessage('');

    try {
      const res = await fetch('/api/admin/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          image_url: imageUrl,
          rarity,
          power_score: Number(powerScore),
          market_value: Number(marketValue),
          claim_code: claimCode.trim().toUpperCase(),
          is_claimed: false,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        setMintMessage(`Error: ${result.error}`);
      } else {
        setMintMessage(`Successfully minted "${name}" with code ${claimCode}!`);
        setName('');
        generateRandomCode(category);
        fetchAllCards();
      }
    } catch (err: any) {
      setMintMessage(`Error: ${err.message}`);
    } finally {
      setMinting(false);
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  }

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Admin Minting Studio</h1>
        <p className="text-xs text-slate-400 mb-6">
          Enter the hackathon organizer password to mint cards and generate physical QR codes.
        </p>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {authError}
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Enter Admin Password..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition"
          >
            Unlock Admin Studio
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-purple-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticated Organizer</span>
          </span>
          <h1 className="text-3xl font-black text-white mt-1">
            Phygital Card Minting & QR Generator
          </h1>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <PlusCircle className="w-5 h-5 text-purple-400" />
          <span>Mint New Phygital Card</span>
        </h2>

        {mintMessage && (
          <div className="mb-6 p-4 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-sm">
            {mintMessage}
          </div>
        )}

        <form onSubmit={handleMintCard} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Card Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Holographic Charizard VMAX"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Category (10 Supported)
            </label>
            <select
              value={category}
              onChange={(e) => {
                const cat = e.target.value as CardCategory;
                setCategory(cat);
                generateRandomCode(cat);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            >
              {CARD_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Rarity
            </label>
            <select
              value={rarity}
              onChange={(e) => setRarity(e.target.value as CardRarity)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            >
              {(['Common', 'Rare', 'Epic', 'Legendary'] as CardRarity[]).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Power Score (1 - 9999)
            </label>
            <input
              type="number"
              min={1}
              max={9999}
              required
              value={powerScore}
              onChange={(e) => setPowerScore(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Initial Market Value ($)
            </label>
            <input
              type="number"
              min={1}
              required
              value={marketValue}
              onChange={(e) => setMarketValue(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Unique QR Claim Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                required
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => generateRandomCode(category)}
                className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                title="Generate New Code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
              Artwork Image URL
            </label>
            <input
              type="url"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={minting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition"
            >
              {minting ? 'Minting...' : 'Mint Card & Generate QR'}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          All Minted Cards & Physical QR Codes ({cards.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center space-x-4"
            >
              <div className="bg-white p-2.5 rounded-xl shrink-0">
                <QRCodeCanvas value={card.claim_code} size={96} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase text-purple-400">
                  {card.category}
                </span>
                <h3 className="text-sm font-bold text-white truncate">{card.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Value: <span className="text-emerald-400 font-bold">${card.market_value}</span> •
                  PWR: {card.power_score}
                </p>

                <div className="mt-2 flex items-center space-x-2">
                  <code className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300">
                    {card.claim_code}
                  </code>
                  <button
                    onClick={() => copyToClipboard(card.claim_code)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                    title="Copy Claim Code"
                  >
                    {copiedCode === card.claim_code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-2">
                  {card.is_claimed ? (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Claimed by {card.owner?.username || 'Collector'}
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Unclaimed — Ready to Scan
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
