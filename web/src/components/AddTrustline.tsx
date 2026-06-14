'use client';
import { useState } from 'react';
import { buildAddUsdcTrustlineXDR } from '@/lib/trustline';
import { signAndSubmit } from '@/lib/sign';

type Status = 'idle' | 'working' | 'done' | 'error';

import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AddTrustline({
  publicKey,
  onDone,
}: {
  publicKey: string;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const add = async () => {
    setStatus('working');
    setError('');
    try {
      const xdr = await buildAddUsdcTrustlineXDR(publicKey);
      await signAndSubmit(xdr, publicKey);
      setStatus('done');
      onDone();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add trustline');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4" />
        USDC Active
      </div>
    );
  }

  return (
    <div className="flex-1">
      <button
        onClick={add}
        disabled={status === 'working'}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-cyan-500/50 hover:text-cyan-400 disabled:opacity-50"
      >
        {status === 'working' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable USDC'}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-500 uppercase font-bold text-center">{error}</p>}
    </div>
  );
}
