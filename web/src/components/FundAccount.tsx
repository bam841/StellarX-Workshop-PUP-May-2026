'use client';
import { useState } from 'react';
import { fundTestnetAccount } from '@/lib/stellar';

import { Coins, Loader2 } from 'lucide-react';

export default function FundAccount({
  publicKey,
  onFunded,
}: {
  publicKey: string;
  onFunded: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fund = async () => {
    setLoading(true);
    setError('');
    try {
      await fundTestnetAccount(publicKey);
      onFunded();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Funding failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1">
      <button
        onClick={fund}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-400 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>
            <Coins className="w-4 h-4" />
            Fund Account
          </>
        )}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-500 uppercase font-bold text-center">{error}</p>}
    </div>
  );
}
