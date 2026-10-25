'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, CARD_CATEGORIES, CardItem } from '@/lib/supabase';
import { Sparkles, Zap, Send, QrCode, CheckCircle2, User, X, Filter } from 'lucide-react';

export default function MarketplacePage() {
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'unclaimed' | 'claimed' | 'mine'>('all');
  const [userId, setUserId] = useState<string | null>(null);

  // Offer Modal State
  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(100);
  const [offerMessage, setOfferMessage] = useState<string>('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    fetchCards();

    const channel = supabase
      .channel('cards-marketplace-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cards' }, () => {
        fetchCards();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchCards() {
    const { data, error } = await supabase
      .from('cards')
      .select('*, owner:profiles(username)')
      .order('power_score', { ascending: false });

    if (!error && data) {
      setCards(data as any);
    }
    setLoading(false);
  }

  async function handleSendOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard || !userId || !selectedCard.owner_id) return;

    setSubmittingOffer(true);
    setFeedback('');

    const { error } = await supabase.from('offers').insert({
      card_id: selectedCard.id,
      buyer_id: userId,
      seller_id: selectedCard.owner_id,
      offer_amount: Number(offerAmount),
      message: offerMessage.trim() || 'I would love to buy this card for my collection!',
      status: 'pending',
    });

    setSubmittingOffer(false);

    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }

    setFeedback('Offer sent to collector! Check Trade Inbox for updates.');
    setTimeout(() => {
      setSelectedCard(null);
      setFeedback('');
    }, 1500);
  }

  const categories = ['All', ...CARD_CATEGORIES];

  const filteredCards = cards.filter((c) => {
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    if (!matchesCat) return false;
    if (ownershipFilter === 'unclaimed') return !c.is_claimed;
    if (ownershipFilter === 'claimed') return c.is_claimed;
    if (ownershipFilter === 'mine') return c.owner_id === userId && !!userId;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-950/70 to-slate-900 border border-purple-500/30 p-8 md:p-10 mb-8 shadow-2xl">
        <div className="max-w-2xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold mb-4 border border-purple-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Physical-to-Digital Trading Ecosystem</span>
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-3">
            Scan Physical Cards. Trade Globally.
          </h1>
          <p className="text-slate-300 text-sm md:text-base mb-6">
            Every physical card features a cryptographic QR claim code. Scan to bind ownership to your digital vault, climb the leaderboard, or make P2P cash offers!
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/claim"
              className="inline-flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-600/30 transition"
            >
              <QrCode className="w-4 h-4" />
              <span>Scan / Claim Card</span>
            </Link>
            <Link
              href="/leaderboard"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2.5 rounded-xl font-bold text-sm border border-slate-700 transition"
            >
              <span>View Leaderboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Ownership Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Vault Filter:</span>
          {(['all', 'unclaimed', 'claimed', 'mine'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setOwnershipFilter(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                ownershipFilter === mode
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {mode === 'mine' ? 'My Vault' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex overflow-x-auto space-x-2 pb-4 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading Phygital Vault...</div>
      ) : filteredCards.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 text-slate-400">
          No cards match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCards.map((card) => {
            const isMine = userId && card.owner_id === userId;
            return (
              <div
                key={card.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition shadow-xl flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-60 overflow-hidden bg-slate-950">
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wider bg-slate-950/85 backdrop-blur-md text-purple-300 border border-purple-500/30">
                      {card.rarity}
                    </span>
                    <span className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-950/85 text-amber-400 border border-amber-500/30">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{card.power_score}</span>
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="text-[11px] text-purple-400 font-bold uppercase tracking-wider mb-1">
                      {card.category}
                    </div>
                    <h3 className="text-base font-extrabold text-white mb-2 truncate">{card.name}</h3>

                    <div className="flex items-center justify-between text-xs text-slate-400 py-2 border-y border-slate-800/80 my-2">
                      <span>Market Value</span>
                      <span className="text-emerald-400 font-black text-sm">
                        ${Number(card.market_value).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="text-slate-500">Status</span>
                      {card.is_claimed ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                          <User className="w-3 h-3" />
                          <span>{isMine ? 'Owned by You' : card.owner?.username || 'Claimed'}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 font-semibold">Unclaimed Physical QR</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  {!card.is_claimed ? (
                    <Link
                      href={`/claim?code=${encodeURIComponent(card.claim_code)}`}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Claim Card ({card.claim_code})</span>
                    </Link>
                  ) : isMine ? (
                    <div className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>In Your Vault</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!userId) {
                          alert('Please click Collector Login in the top right first!');
                          return;
                        }
                        setSelectedCard(card);
                        setOfferAmount(Number(card.market_value));
                        setOfferMessage(`Hi! Offering $${card.market_value} for your ${card.name}.`);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Make P2P Trade Offer</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* P2P Trade Offer Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedCard(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-extrabold text-white mb-1">Make P2P Buy Offer</h2>
            <p className="text-xs text-slate-400 mb-4">
              Propose a buyout to <span className="text-purple-400 font-bold">{selectedCard.owner?.username || 'Collector'}</span> for <span className="text-white font-semibold">{selectedCard.name}</span>.
            </p>

            {feedback && (
              <div className="mb-4 p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs">
                {feedback}
              </div>
            )}

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Your Offer Amount ($)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Message to Owner
                </label>
                <textarea
                  rows={3}
                  required
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submittingOffer}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition"
              >
                {submittingOffer ? 'Sending Offer...' : 'Submit P2P Offer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
