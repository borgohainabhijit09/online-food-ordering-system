'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag, LayoutDashboard, ArrowRight, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

const ADMIN_PHONE = '9113067486';
const ADMIN_PASS = 'Daksh#123';

export default function DemoPage() {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const copy = (text: string, type: 'phone' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <header className="border-b border-white/5 py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-orange-600/20">R</div>
            <span className="font-bold text-xl tracking-tight text-white">RestoBuddy</span>
          </Link>
          <Link href="/" className="text-sm text-neutral-400 hover:text-white transition-colors font-semibold">← Back to Home</Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16 max-w-2xl">
          <span className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-widest mb-6">Live Demo</span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Explore RestoBuddy <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Live &amp; Hands-On</span>
          </h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Experience both sides of RestoBuddy — the customer ordering journey and the full restaurant management dashboard.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">

          {/* Customer Panel */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col hover:border-orange-500/40 hover:bg-white/[0.05] transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-7 h-7 text-orange-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Customer Experience</span>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Customer Panel</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-1">Browse the live demo menu, add items to your cart, and experience the complete customer ordering journey — no account needed.</p>
            <div className="space-y-2 mb-8 text-sm text-neutral-500">
              {['QR Menu browsing', 'Add to cart & checkout', 'WhatsApp-style ordering'].map(f => (
                <div key={f} className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-orange-500" />{f}</div>
              ))}
            </div>
            <Link href="/demo-restaurant" target="_blank" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold rounded-2xl hover:from-orange-500 hover:to-rose-500 transition-all active:scale-95 shadow-lg shadow-orange-500/20">
              Open Customer Panel <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Admin Panel */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 flex flex-col hover:border-violet-500/40 hover:bg-white/[0.05] transition-all duration-300 group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-7 h-7 text-violet-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Owner Experience</span>
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Restaurant Admin Panel</h2>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6 flex-1">Log in to the full restaurant dashboard. Manage orders, menu, customers, analytics, and more — exactly as a restaurant owner would.</p>

            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">Demo Credentials</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Phone / Login</p>
                  <p className="text-white font-mono font-bold text-sm">{ADMIN_PHONE}</p>
                </div>
                <button onClick={() => copy(ADMIN_PHONE, 'phone')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-400 hover:text-white transition-all">
                  {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedPhone ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-0.5">Password</p>
                  <p className="text-white font-mono font-bold text-sm tracking-widest">{showPass ? ADMIN_PASS : '••••••••'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowPass(v => !v)} className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all">
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => copy(ADMIN_PASS, 'pass')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-400 hover:text-white transition-all">
                    {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPass ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>

            <Link href="/admin/login" target="_blank" className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-2xl hover:from-violet-500 hover:to-purple-500 transition-all active:scale-95 shadow-lg shadow-violet-500/20">
              Open Admin Panel <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-12 text-neutral-600 text-sm text-center">
          This is a live demo environment. Data may be reset periodically. &nbsp;
          <Link href="/" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">Ready to get started? Book a free demo →</Link>
        </motion.p>
      </div>
    </div>
  );
}
