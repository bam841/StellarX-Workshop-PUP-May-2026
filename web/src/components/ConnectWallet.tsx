'use client';
import { useState } from 'react';
import type { WalletState } from '@/hooks/useWallet';

import { LogOut, Copy, Check } from 'lucide-react';

export default function ConnectWallet({
  publicKey,
  connecting,
  error,
  connect,
  disconnect,
}: WalletState) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={copy}
          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 font-mono text-xs text-slate-300 transition-all hover:border-slate-700 hover:text-white"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
          {publicKey.slice(0, 4)}…{publicKey.slice(-4)}
        </button>
        <button
          onClick={disconnect}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-500 hover:text-red-400 hover:border-red-400/50 transition-all"
          title="Disconnect"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        onClick={connect}
        disabled={connecting}
        className="relative group px-6 py-2.5 rounded-xl bg-white text-slate-950 font-bold text-sm transition-all hover:bg-slate-200 disabled:opacity-50"
      >
        <div className="absolute inset-0 rounded-xl bg-indigo-500/20 blur-xl group-hover:bg-indigo-500/40 transition-all" />
        <span className="relative">{connecting ? 'Syncing...' : 'Connect Wallet'}</span>
      </button>
      {error && <p className="mt-2 max-w-xs text-[10px] uppercase font-bold text-red-500 tracking-tighter">{error}</p>}
    </div>
  );
}
