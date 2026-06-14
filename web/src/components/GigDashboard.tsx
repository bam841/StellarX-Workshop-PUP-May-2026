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
import { useUser } from '@/context/UserContext';
import { hasUSDCTrustline } from '@/lib/balances';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';
import { Plus, Send, CheckCircle2, Wallet, User, Briefcase, RefreshCcw } from 'lucide-react';

export default function GigDashboard({ publicKey }: { publicKey: string | null }) {
  const { role, profile } = useUser();
  const configured = Boolean(GIG_CONTRACT_ID);
  
  const [gigs, setGigs] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [hasTrustline, setHasTrustline] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Form states for Client
  const [newGigTitle, setNewGigTitle] = useState('');
  const [selectedFreelancer, setSelectedFreelancer] = useState('');
  const [newGigAmount, setNewGigAmount] = useState('');

  const fetchData = useCallback(async () => {
    if (!publicKey || !role) return;
    setLoading(true);
    try {
      // Fetch Gigs
      const gigRes = await fetch(`/api/gigs?publicKey=${publicKey}&role=${role}`);
      if (gigRes.ok) setGigs(await gigRes.json());

      // If client, fetch freelancers
      if (role === 'CLIENT') {
        const freeRes = await fetch('/api/freelancers');
        if (freeRes.ok) setFreelancers(await freeRes.json());
      }

      setHasTrustline(await hasUSDCTrustline(publicKey));
    } catch (e) {
      console.error('Fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, [publicKey, role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const signAndSubmit = async (xdr: string) => {
    if (!publicKey) return;
    const freighter = await import('@stellar/freighter-api');
    const signed = await freighter.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: publicKey,
    });
    if (signed.error) throw new Error('Signing was rejected');
    const hash = await submitSignedXDR(signed.signedTxXdr);
    await pollTransaction(hash);
  };

  const createGig = async () => {
    if (!publicKey || role !== 'CLIENT') return;
    setBusy(true);
    setError('');
    try {
      // 1. Initialize On-Chain
      const xdr = await buildInitEscrowXDR(publicKey, selectedFreelancer, Number(newGigAmount));
      await signAndSubmit(xdr);

      // 2. Save Off-Chain
      await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newGigTitle,
          amount: newGigAmount,
          clientId: publicKey,
          freelancerId: selectedFreelancer,
        }),
      });

      setNewGigTitle('');
      setNewGigAmount('');
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeposit = async (gigId: number) => {
    setBusy(true);
    try {
      const xdr = await buildDepositXDR(publicKey!);
      await signAndSubmit(xdr);
      await fetch('/api/gigs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gigId, status: 1 }), // Funded
      });
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async (gigId: number) => {
    setBusy(true);
    try {
      const xdr = await buildReleaseXDR(publicKey!);
      await signAndSubmit(xdr);
      await fetch('/api/gigs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gigId, status: 2 }), // Released
      });
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!configured) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          {role === 'CLIENT' ? 'Client Workspace' : 'Freelancer Portal'}
        </h2>
        <button onClick={fetchData} className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition-colors">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {!hasTrustline && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-amber-500" />
            <p className="text-sm text-amber-200/80">USDC Trustline required to handle gig payments.</p>
          </div>
          <button 
             onClick={async () => {
                const xdr = await buildUSDCStoreTrustlineXDR(publicKey!);
                await signAndSubmit(xdr);
                await fetchData();
             }}
             className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors"
          >
            Enable USDC
          </button>
        </div>
      )}

      {role === 'CLIENT' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* New Gig Form */}
          <div className="md:col-span-1 p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Gig
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Project Title"
                value={newGigTitle}
                onChange={(e) => setNewGigTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <select
                value={selectedFreelancer}
                onChange={(e) => setSelectedFreelancer(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select Freelancer</option>
                {freelancers.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.skills || 'General'})</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Amount (USDC)"
                value={newGigAmount}
                onChange={(e) => setNewGigAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={createGig}
                disabled={busy || !newGigTitle || !selectedFreelancer || !newGigAmount}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {busy ? 'Processing...' : 'Create & Initialize'}
              </button>
            </div>
          </div>

          {/* Gigs List */}
          <div className="md:col-span-2 space-y-4">
             {gigs.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-800 text-slate-500">
                  <p>No active gigs found.</p>
               </div>
             ) : (
               gigs.map(gig => (
                 <div key={gig.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-all">
                    <div className="flex items-start justify-between mb-4">
                       <div>
                          <h4 className="font-bold text-white">{gig.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <User className="w-3 h-3 text-slate-500" />
                             <p className="text-xs text-slate-400">Freelancer: {gig.freelancer.name}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-mono text-cyan-400 font-bold">{gig.amount} USDC</p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            gig.status === 0 ? 'bg-indigo-500/10 text-indigo-400' :
                            gig.status === 1 ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {gig.status === 0 ? 'Initialized' : gig.status === 1 ? 'Funded' : 'Released'}
                          </span>
                       </div>
                    </div>
                    
                    <div className="flex gap-2">
                       {gig.status === 0 && (
                         <button 
                           onClick={() => handleDeposit(gig.id)}
                           disabled={busy}
                           className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition-colors disabled:opacity-50"
                         >
                           <Send className="w-3 h-3" /> Deposit Funds
                         </button>
                       )}
                       {gig.status === 1 && (
                         <button 
                            onClick={() => handleRelease(gig.id)}
                            disabled={busy}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50"
                         >
                           <CheckCircle2 className="w-3 h-3" /> Release Payment
                         </button>
                       )}
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {role === 'FREELANCER' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-xl">
             <h3 className="font-bold text-slate-200 mb-6 flex items-center gap-2">
               <Briefcase className="w-4 h-4 text-cyan-400" /> Incoming Assignments
             </h3>
             
             {gigs.length === 0 ? (
               <div className="text-center py-12 text-slate-500">
                  <p>You haven't been assigned any gigs yet.</p>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {gigs.map(gig => (
                    <div key={gig.id} className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50">
                       <div className="flex items-center justify-between">
                          <div>
                             <h4 className="font-bold text-white text-lg">{gig.title}</h4>
                             <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                               Client: <span className="text-slate-300 font-medium">{gig.client.name}</span>
                             </p>
                          </div>
                          <div className="text-right">
                             <p className="text-lg font-mono text-cyan-400 font-bold">{gig.amount} USDC</p>
                             <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                               gig.status === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                             }`}>
                               {gig.status === 1 ? 'Work Authorized (Funded)' : gig.status === 2 ? 'Paid' : 'Awaiting Funds'}
                             </span>
                          </div>
                       </div>
                       {gig.status === 1 && (
                         <div className="mt-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <p className="text-xs text-emerald-400/80 flex items-center gap-2">
                               <CheckCircle2 className="w-3 h-3" /> The funds for this gig are locked in the smart contract. You can safely begin working.
                            </p>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
             )}
          </div>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
