'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  GIG_CONTRACT_ID,
  EscrowStatus,
  getEscrowStatus,
  buildInitEscrowXDR,
  buildDepositXDR,
  buildReleaseXDR,
  buildUSDCStoreTrustlineXDR,
} from '@/lib/gig-escrow';
import { hasUSDCTrustline } from '@/lib/balances';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

export default function GigDashboard({ publicKey }: { publicKey: string | null }) {
  const configured = Boolean(GIG_CONTRACT_ID);
  const [status, setStatus] = useState<EscrowStatus>(EscrowStatus.Initialized);
  const [hasTrustline, setHasTrustline] = useState<boolean>(true);
  const [loading, setLoading] = useState(configured);
  const [freelancer, setFreelancer] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError('');
    try {
      setStatus(await getEscrowStatus());
      if (publicKey) {
        setHasTrustline(await hasUSDCTrustline(publicKey));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read escrow status');
    } finally {
      setLoading(false);
    }
  }, [configured, publicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signAndSubmit = async (xdr: string) => {
    if (!publicKey) return;
    const freighter = await import('@stellar/freighter-api');
    const signed = await freighter.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: publicKey,
    });
    if (signed.error) {
      throw new Error(
        typeof signed.error === 'string' ? signed.error : 'Signing was rejected',
      );
    }
    const hash = await submitSignedXDR(signed.signedTxXdr);
    await pollTransaction(hash);
  };

  const addTrustline = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildUSDCStoreTrustlineXDR(publicKey);
      await signAndSubmit(xdr);
      setMsg('USDC Trustline added!');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add trustline');
    } finally {
      setBusy(false);
    }
  };

  const initEscrow = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildInitEscrowXDR(publicKey, freelancer, Number(amount));
      await signAndSubmit(xdr);
      setMsg('Escrow initialized!');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Initialization failed');
    } finally {
      setBusy(false);
    }
  };

  const deposit = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildDepositXDR(publicKey);
      await signAndSubmit(xdr);
      setMsg('Funds deposited into escrow!');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Deposit failed');
    } finally {
      setBusy(false);
    }
  };

  const release = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildReleaseXDR(publicKey);
      await signAndSubmit(xdr);
      setMsg('Funds released to freelancer!');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Release failed');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="mt-6 rounded border border-dashed border-gray-300 bg-gray-50 p-6">
        <h2 className="text-lg font-semibold text-gray-900 text-purple-700">Gig Payment Rail (Escrow)</h2>
        <p className="mt-2 text-sm text-gray-600">
          Deploy the <code>gig-escrow</code> contract to enable this dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded border border-purple-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-purple-800">
        Gig Payment Rail (USDC Escrow)
      </h2>

      {loading && <p className="text-sm text-gray-400">Syncing with blockchain…</p>}

      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-sm font-medium text-purple-700">Escrow Status:</span>
            <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-purple-200 text-purple-800">
              {EscrowStatus[status]}
            </span>
          </div>

          {publicKey && !hasTrustline && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700 mb-2">
                You need a USDC Trustline to receive or handle USDC.
              </p>
              <button
                onClick={addTrustline}
                disabled={busy}
                className="w-full py-2 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {busy ? 'Processing...' : 'Enable USDC Trustline'}
              </button>
            </div>
          )}

          {(status === EscrowStatus.Initialized || status === EscrowStatus.Released || status === EscrowStatus.Refunded) && (
            <div className="space-y-3 p-4 border border-gray-100 rounded-lg bg-gray-50">
               <p className="text-sm font-semibold text-gray-700">1. Setup Escrow</p>
               <input
                type="text"
                placeholder="Freelancer Public Key (G...)"
                value={freelancer}
                onChange={(e) => setFreelancer(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Amount (USDC)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                onClick={initEscrow}
                disabled={busy || !publicKey || !freelancer || !amount}
                className="w-full py-2 bg-purple-600 text-white rounded font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {status === EscrowStatus.Initialized ? 'Initialize Escrow' : 'Start New Gig Escrow'}
              </button>
            </div>
          )}

          {status === EscrowStatus.Initialized && (
             <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">2. Deposit Funds</p>
                <button
                  onClick={deposit}
                  disabled={busy || !publicKey}
                  className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Deposit USDC into Escrow
                </button>
             </div>
          )}

          {status === EscrowStatus.Funded && (
             <div className="p-4 border border-gray-100 rounded-lg bg-gray-50">
                <p className="text-sm font-semibold text-gray-700 mb-2">3. Release to Freelancer</p>
                <button
                  onClick={release}
                  disabled={busy || !publicKey}
                  className="w-full py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  Release USDC Payment
                </button>
             </div>
          )}

          {status === EscrowStatus.Released && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-center font-bold">
               Gig Paid Successfully! 🎉
            </div>
          )}
        </div>
      )}

      {msg && <p className="mt-3 text-sm text-emerald-600 font-medium text-center">{msg}</p>}
      {error && <p className="mt-3 text-sm text-red-500 font-medium text-center">{error}</p>}
    </div>
  );
}
