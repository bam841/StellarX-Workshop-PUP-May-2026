'use client';
import { useState } from 'react';
import { useUser } from '@/context/UserContext';
import { Briefcase, Users, ArrowRight, Loader2 } from 'lucide-react';

export default function Onboarding({ publicKey }: { publicKey: string }) {
  const { checkUser } = useUser();
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER' | null>(null);
  const [name, setName] = useState('');
  const [additional, setAdditional] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!role || !name) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey,
          name,
          role,
          additional,
        }),
      });
      if (!res.ok) throw new Error('Registration failed');
      await checkUser(publicKey);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-cyan-500/10">
        <div className="p-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Welcome to the Rail
          </h2>
          <p className="mt-2 text-slate-400">Complete your profile to start transacting.</p>

          {!role ? (
            <div className="mt-8 space-y-4">
              <button
                onClick={() => setRole('CLIENT')}
                className="group w-full flex items-center justify-between p-6 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-indigo-500/10 group-hover:bg-indigo-500/20 text-indigo-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-200">I am Hiring</p>
                    <p className="text-sm text-slate-400">Hire freelancers and pay securely with USDC.</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                onClick={() => setRole('FREELANCER')}
                className="group w-full flex items-center justify-between p-6 rounded-2xl border border-slate-800 bg-slate-800/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 text-cyan-400">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-200">I am Looking for Work</p>
                    <p className="text-sm text-slate-400">Get paid instantly in USDC from global clients.</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    {role === 'CLIENT' ? 'Company Name (Optional)' : 'Skills (e.g. Rust, React, Designer)'}
                  </label>
                  <input
                    type="text"
                    value={additional}
                    onChange={(e) => setAdditional(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder={role === 'CLIENT' ? "Your company name" : "Your top skills"}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRole(null)}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleRegister}
                  disabled={busy || !name}
                  className="flex-[2] flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold transition-all disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Profile'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
