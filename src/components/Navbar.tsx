'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase, Profile } from '@/lib/supabase';
import {
  ShoppingBag,
  QrCode,
  Trophy,
  ShieldCheck,
  Wallet,
  LogIn,
  LogOut,
  User as UserIcon,
  Inbox,
  Sparkles,
  X,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) fetchProfile(uid);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        fetchProfile(uid);
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(uid: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      if (!data.username) {
        setShowUsernameModal(true);
      }
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user) {
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
          await fetchProfile(data.user.id);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
          await fetchProfile(data.user.id);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSaveUsername(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError('');
    const trimmed = newUsername.trim();
    if (trimmed.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    if (!userId) return;

    const { data, error } = await supabase
      .from('profiles')
      .update({ username: trimmed })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      setUsernameError(error.message.includes('unique') ? 'Username already taken!' : error.message);
      return;
    }

    setProfile(data as Profile);
    setShowUsernameModal(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setUserId(null);
  }

  const navItems = [
    { href: '/', label: 'Marketplace', icon: ShoppingBag },
    { href: '/claim', label: 'Claim QR', icon: QrCode },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/offers', label: 'Trade Inbox', icon: Inbox },
    { href: '/admin', label: 'Admin', icon: ShieldCheck },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <span className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-500 to-amber-400 bg-clip-text text-transparent">
                PhygitalVault
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      active
                        ? 'bg-purple-600/25 text-purple-300 border border-purple-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-3">
              {userId && profile ? (
                <>
                  <div className="flex items-center space-x-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                    <Wallet className="w-4 h-4" />
                    <span>${Number(profile.wallet_balance).toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => {
                      setNewUsername(profile.username || '');
                      setShowUsernameModal(true);
                    }}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs font-semibold text-slate-200 transition"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                    <span>{profile.username || 'Set Username'}</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    title="Sign Out"
                    className="p-2 rounded-full bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-600/25 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Collector Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-extrabold text-white mb-1">
              {isSignUp ? 'Create Collector Vault' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {isSignUp
                ? 'Sign up to receive $1,000 in virtual vault credits immediately.'
                : 'Sign in to claim QR cards and trade with collectors.'}
            </p>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collector@hackathon.io"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm transition"
              >
                {authLoading ? 'Processing...' : isSignUp ? 'Sign Up & Claim $1,000' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError('');
                }}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need a collector account? Sign Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-white mb-1">Choose Your Public Handle</h2>
            <p className="text-xs text-slate-400 mb-5">
              Your email stays 100% private. Choose a public collector username for the Leaderboard and Trading Vault.
            </p>

            {usernameError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {usernameError}
              </div>
            )}

            <form onSubmit={handleSaveUsername} className="space-y-4">
              <input
                type="text"
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. SatoshiCollector"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <div className="flex justify-end space-x-2">
                {profile?.username && (
                  <button
                    type="button"
                    onClick={() => setShowUsernameModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold"
                >
                  Save Handle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
