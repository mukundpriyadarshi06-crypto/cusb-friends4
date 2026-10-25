'use client';

import React, { useEffect, useState } from 'react';
import { supabase, OfferItem } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { Inbox, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function OffersInboxPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) fetchOffers(uid);
      else setLoading(false);
    });
  }, []);

  async function fetchOffers(uid: string) {
    const { data } = await supabase
      .from('offers')
      .select('*, card:cards(*), buyer:profiles!offers_buyer_id_fkey(username), seller:profiles!offers_seller_id_fkey(username)')
      .or(`seller_id.eq.${uid},buyer_id.eq.${uid}`)
      .order('created_at', { ascending: false });

    if (data) setOffers(data as any);
    setLoading(false);
  }

  async function handleAcceptOffer(offerId: string) {
    if (!userId) return;
    setProcessingId(offerId);
    setStatusMessage('');

    const { data, error } = await supabase.rpc('accept_card_offer', {
      p_offer_id: offerId,
    });

    setProcessingId(null);

    if (error || (data && !data.success)) {
      setStatusMessage(`Transaction Error: ${error?.message || data?.error}`);
      return;
    }

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setStatusMessage('Trade completed! Funds added to your wallet and card ownership transferred.');
    fetchOffers(userId);
  }

  async function handleDeclineOffer(offerId: string) {
    if (!userId) return;
    setProcessingId(offerId);
    await supabase.from('offers').update({ status: 'declined' }).eq('id', offerId);
    setProcessingId(null);
    fetchOffers(userId);
  }

  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-400">
        Please log in using the Collector Login button in the navbar to view your P2P Trade Inbox.
      </div>
    );
  }

  const incoming = offers.filter((o) => o.seller_id === userId);
  const outgoing = offers.filter((o) => o.buyer_id === userId);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white flex items-center space-x-2.5">
          <Inbox className="w-7 h-7 text-purple-400" />
          <span>P2P Trade & Offer Inbox</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Accepting an offer executes an atomic transaction transferring wallet credits and card ownership simultaneously.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-sm">
          {statusMessage}
        </div>
      )}

      {/* Incoming Offers */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
          <span>Incoming Buy Offers ({incoming.length})</span>
        </h2>

        {loading ? (
          <div className="text-slate-400 text-sm">Loading offers...</div>
        ) : incoming.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm">
            No incoming offers yet.
          </div>
        ) : (
          <div className="space-y-4">
            {incoming.map((o) => (
              <div
                key={o.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <span className="text-xs font-bold text-purple-400">
                    From Collector: {o.buyer?.username || 'Anonymous'}
                  </span>
                  <h3 className="text-base font-extrabold text-white">
                    {o.card?.name || 'Trading Card'} — Offer:{' '}
                    <span className="text-emerald-400">${Number(o.offer_amount).toLocaleString()}</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 italic">"{o.message}"</p>
                </div>

                <div className="flex items-center space-x-3">
                  {o.status === 'pending' ? (
                    <>
                      <button
                        disabled={processingId === o.id}
                        onClick={() => handleAcceptOffer(o.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept & Transfer</span>
                      </button>
                      <button
                        disabled={processingId === o.id}
                        onClick={() => handleDeclineOffer(o.id)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 text-xs font-bold flex items-center space-x-1 transition"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300">
                      {o.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Offers */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
          <ArrowUpRight className="w-5 h-5 text-purple-400" />
          <span>Sent Offers ({outgoing.length})</span>
        </h2>

        {outgoing.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 text-sm">
            You haven't sent any trade offers yet.
          </div>
        ) : (
          <div className="space-y-4">
            {outgoing.map((o) => (
              <div
                key={o.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs text-slate-400">
                    To Owner: {o.seller?.username || 'Collector'}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {o.card?.name} • Offered:{' '}
                    <span className="text-emerald-400 font-extrabold">${o.offer_amount}</span>
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-800 text-slate-300">
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
