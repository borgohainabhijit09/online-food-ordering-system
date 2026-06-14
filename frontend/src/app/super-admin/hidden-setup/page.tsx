'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HiddenSetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    adminKey: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Success! ' + data.message);
        router.push('/super-admin/login');
      } else {
        alert(data.message || 'Setup failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 p-4 font-sans text-white">
      <div className="bg-neutral-900 p-8 rounded-2xl w-full max-w-md border border-neutral-800 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Super Admin Setup</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2">Name</label>
            <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Phone</label>
            <input type="text" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Password</label>
            <input type="password" className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-white" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-red-400">Secret Setup Key</label>
            <input type="password" className="w-full bg-neutral-950 border border-red-900 rounded-lg p-3 text-white focus:ring-red-500" value={formData.adminKey} onChange={e => setFormData({...formData, adminKey: e.target.value})} required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-xl mt-4 hover:bg-neutral-200 disabled:opacity-50">
            {loading ? 'Processing...' : 'Create Super Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}

