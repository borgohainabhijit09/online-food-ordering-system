'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

export default function SuperAdminLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.user.role !== 'SUPER_ADMIN') {
          setError('Access denied. Super Admin privileges required.');
          return;
        }
        localStorage.setItem('superAdminToken', data.token);
        localStorage.setItem('superAdminMode', 'true');
        router.push('/super-admin');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-4 font-sans text-white relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '64px 64px' }}></div>

      <div className="w-full max-w-sm relative z-10">
        {/* Branding header outside the card */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-rose-500 p-[1px] rounded-2xl mb-6 shadow-2xl shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0a0a0a] rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-400">RestoBuddy</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-[1px] w-8 bg-neutral-800"></div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em]">Super Admin</p>
            <div className="h-[1px] w-8 bg-neutral-800"></div>
          </div>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="bg-[#111111]/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-1">Access Terminal</h2>
            <p className="text-sm text-neutral-400">Authenticate to enter the management portal.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm mb-6 border border-red-500/20 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Master Phone</label>
              <input 
                type="text" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-neutral-700" 
                value={phone} 
                onChange={e => setPhone(e.target.value)}
                placeholder="Admin Phone Number" 
                required 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Master Key</label>
              <input 
                type="password" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-neutral-700" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="••••••••••••"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-white text-black font-bold py-3.5 rounded-xl mt-8 hover:bg-neutral-200 disabled:opacity-50 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Authenticating...
                </>
              ) : (
                'Secure Login'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

