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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/login`, {
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
        localStorage.setItem('adminToken', data.token); // Reusing the same token storage as it's an admin token conceptually
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
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-sans text-white">
      <div className="bg-neutral-900 p-8 rounded-2xl w-full max-w-sm border border-neutral-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-neutral-950 rounded-full flex items-center justify-center border border-neutral-800">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-2 text-center">Super Admin</h1>
        <p className="text-neutral-500 text-sm text-center mb-8">Platform Management Portal</p>

        {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-500/20 text-center font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Phone Number</label>
            <input 
              type="text" 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-white outline-none transition-all" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-white focus:ring-2 focus:ring-white outline-none transition-all" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-white text-black font-bold py-4 rounded-xl mt-6 hover:bg-neutral-200 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
