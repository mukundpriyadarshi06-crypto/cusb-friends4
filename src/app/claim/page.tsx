'use client';

import React, { useEffect, useState } from 'react';
import { supabase, CardItem } from '@/lib/supabase';
import confetti from 'canvas-confetti';
import { QrCode, Camera, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClaimCardPage() {
  const [claimCode, setClaimCode] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [claimedCard, setClaimedCard] = useState<CardItem | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      if (codeParam) setClaimCode(codeParam.toUpperCase());
    }
  }, []);

  useEffect(() => {
    if (!scannerActive) return;
    let html5QrcodeScanner: any = null;

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 240, height: 240 } },
        false
      );
      html5QrcodeScanner.render(
        (decodedText: string) => {
          setClaimCode(decodedText.trim().toUpperCase());
          setScannerActive(false);
          html5QrcodeScanner.clear();
        },
        () => {}
      );
    });

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(() => {});
      }
    };
  }, [scannerActive]);

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setClaimedCard(null);

    if (!userId) {
      setErrorMsg('Please sign in using Collector Login in the top navbar before claiming a card.');
      return;
    }

    const code = claimCode.trim().toUpperCase();
    if (!code) return;

    setLoading(true);

    const { data: card, error: fetchErr } = await supabase
      .from('cards')
      .select('*')
      .eq('claim_code', code)
      .single();

    if (fetchErr || !card) {
      setLoading(false);
      setErrorMsg('Invalid claim code! No physical card matches that code.');
      return;
    }

    if (card.is_claimed) {
      setLoading(false);
      setErrorMsg('This physical card has already been claimed into a digital vault!');
      return;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('cards')
      .update({ is_claimed: true, owner_id: userId })
      .eq('id', card.id)
      .select()
      .single();

    setLoading(false);

    if (updateErr) {
      setErrorMsg(updateErr.message);
      return;
    }

    setClaimedCard(updated as CardItem);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Claim Phygital QR Card</h1>
            <p className="text-xs text-slate-400">
              Scan your physical card QR code or enter its unique claim code below.
            </p>
          </div>
        </div>

        {/* Camera Scanner Toggle */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setScannerActive(!scannerActive)}
            className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-300 text-xs font-bold flex items-center justify-center space-x-2 transition"
          >
            <Camera className="w-4 h-4" />
            <span>{scannerActive ? 'Close Camera Scanner' : 'Open Camera QR Scanner'}</span>
          </button>

          {scannerActive && (
            <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div id="qr-reader" className="w-full overflow-hidden rounded-xl" />
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Unique Claim Code (e.g. PKM-CHAR-001)
            </label>
            <input
              type="text"
              required
              value={claimCode}
              onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
              placeholder="PKM-CHAR-001"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-300 font-mono text-base tracking-wider focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/25 transition"
          >
            {loading ? 'Verifying Authenticity...' : 'Verify & Claim to Digital Vault'}
          </button>
        </form>

        {/* Demo Quick-Fill Codes */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-xs text-slate-400 mb-2 font-semibold">
            Quick-Test Demo Codes (Click to Fill):
          </p>
          <div className="flex flex-wrap gap-2">
            {['PKM-CHAR-001', 'CRK-KOHL-003', 'FTB-MESS-004', 'MRV-IRON-006', 'ANM-GOJO-007', 'HCK-FOUND-011'].map(
              (sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setClaimCode(sample)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300"
                >
                  {sample}
                </button>
              )
            )}
          </div>
        </div>

        {/* Claimed Celebration Card */}
        {claimedCard && (
          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/40 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h2 className="text-xl font-black text-white">Card Successfully Claimed!</h2>
            <p className="text-xs text-emerald-300 mb-4">
              {claimedCard.name} ({claimedCard.rarity}) is now bound to your digital vault.
            </p>
            <img
              src={claimedCard.image_url}
              alt={claimedCard.name}
              className="w-40 h-52 object-cover rounded-xl mx-auto border border-emerald-500/30 shadow-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
