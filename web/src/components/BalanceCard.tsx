'use client';
import { useState, useEffect } from 'react';
import { fetchBalances, type Balances } from '@/lib/balances';

export default function BalanceCard({
  publicKey,
  refreshKey,
}: {
  publicKey: string;
  refreshKey: number;
}) {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchBalances(publicKey)
      .then((b) => active && setBalances(b))
      .catch(() => active && setBalances(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [publicKey, refreshKey]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-slate-900" />
        <div className="h-24 rounded-2xl bg-slate-900" />
      </div>
    );
  }

  if (balances && !balances.funded) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-500/80">Account Status</p>
        <p className="text-sm text-amber-200/60 mt-1 italic">Awaiting Network Activation...</p>
      </div>
    );
  }

  if (!balances) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-xl transition-all hover:border-indigo-500/30">
        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
           <div className="w-8 h-8 rounded-full border-2 border-indigo-400" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">XLM Balance</p>
        <p className="mt-2 text-2xl font-mono font-bold text-white tracking-tight">{balances.xlm}</p>
      </div>
      
      <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-xl transition-all hover:border-cyan-500/30">
        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
           <div className="w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/10" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">USDC Assets</p>
        <p className="mt-2 text-2xl font-mono font-bold text-white tracking-tight">{balances.usdc}</p>
      </div>
    </div>
  );
}
