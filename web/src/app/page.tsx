'use client';
import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useUser } from '@/context/UserContext';
import ConnectWallet from '@/components/ConnectWallet';
import FundAccount from '@/components/FundAccount';
import AddTrustline from '@/components/AddTrustline';
import BalanceCard from '@/components/BalanceCard';
import SendPayment from '@/components/SendPayment';
import SavingsGoal from '@/components/SavingsGoal';
import GigDashboard from '@/components/GigDashboard';
import Onboarding from '@/components/Onboarding';
import { Sparkles, Zap, Shield, Globe } from 'lucide-react';

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connecting } = wallet;
  const { role, profile, loading: authLoading, checkUser } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (publicKey) {
      checkUser(publicKey);
    }
  }, [publicKey, checkUser]);

  return (
    <main className="min-h-screen w-full bg-slate-950 text-slate-100 selection:bg-cyan-500/30">
      {/* Background Decorative Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-12">
        <header className="mb-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                StellarX Rail
              </h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Next-Gen Gig Economy
              </p>
            </div>
          </div>
          <ConnectWallet {...wallet} />
        </header>

        {!publicKey && !connecting && (
          <div className="relative group overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900/50 p-12 text-center backdrop-blur-xl transition-all hover:border-indigo-500/30">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-indigo-400">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">The Future of Work</h2>
            <p className="mx-auto max-w-xs text-slate-400 mb-8">
              Connect your wallet to access the decentralized gig payment rail.
            </p>
            <button 
              onClick={wallet.connect}
              className="px-8 py-3 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-colors shadow-xl shadow-white/5"
            >
              Launch Dashboard
            </button>
          </div>
        )}

        {publicKey && !authLoading && !role && (
          <Onboarding publicKey={publicKey} />
        )}

        {publicKey && role && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between p-6 rounded-3xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-lg">
                  {profile?.name?.[0] || 'U'}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Welcome back,</p>
                  <p className="text-lg font-bold text-white leading-tight">{profile?.name}</p>
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                {role} Profile
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FundAccount publicKey={publicKey} onFunded={refresh} />
              <AddTrustline publicKey={publicKey} onDone={refresh} />
            </div>

            <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />

            <div className="pt-4 border-t border-slate-800">
               <GigDashboard publicKey={publicKey} />
            </div>

            <div className="pt-4 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
               <SavingsGoal publicKey={publicKey} />
            </div>
          </div>
        )}

        <footer className="mt-20 border-t border-slate-900 pt-8 text-center">
          <div className="flex justify-center gap-6 mb-4">
            <Globe className="w-4 h-4 text-slate-600" />
            <Shield className="w-4 h-4 text-slate-600" />
            <Zap className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.2em]">
            StellarX Workshop PUP QC · 2026
          </p>
        </footer>
      </div>
    </main>
  );
}
