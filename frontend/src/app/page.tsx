'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Store, Smartphone, BarChart3 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">
              O
            </div>
            <span className="font-bold text-xl tracking-tight">OmniServe</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-sm">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-24">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-amber-500 pb-2">
            Your Restaurant's <br /> Digital Storefront.
          </h1>
          <p className="text-xl text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
            Launch a premium, mobile-first ordering experience in minutes. No coding required. Beautiful menus, seamless checkout, and powerful management tools.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/20 transition-all flex items-center justify-center gap-2 active:scale-95">
              Get Started Now <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo-restaurant" className="w-full sm:w-auto px-8 py-4 bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 active:scale-95">
              View Live Demo
            </Link>
            <Link href="/admin/login" className="w-full sm:w-auto px-8 py-4 border-2 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold rounded-full hover:border-neutral-300 dark:hover:border-neutral-700 transition-all flex items-center justify-center gap-2 active:scale-95">
              Admin Login
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-neutral-50 dark:bg-neutral-900/50 p-8 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-2xl mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Mobile First</h3>
              <p className="text-neutral-500 dark:text-neutral-400">Provide an app-like experience to your customers without them needing to download anything.</p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900/50 p-8 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center rounded-2xl mb-6">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Menu</h3>
              <p className="text-neutral-500 dark:text-neutral-400">Beautifully display your products with variants, addons, and dietary tags to increase order value.</p>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-900/50 p-8 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center rounded-2xl mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Powerful Dashboard</h3>
              <p className="text-neutral-500 dark:text-neutral-400">Manage orders in real-time, update settings instantly, and track revenue effortlessly.</p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-3xl font-bold mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* App Only */}
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 flex flex-col text-left">
              <h3 className="text-2xl font-bold mb-2">App Only</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 flex-1">Digital web & mobile ordering for your restaurant.</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold">₹499</span>
                <span className="text-neutral-500">/mo + GST</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Full digital menu</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Order management</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">QR Code ordering</span>
                </div>
              </div>
              <Link href="/signup" className="block w-full text-center px-8 py-4 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white font-bold rounded-xl hover:scale-105 transition-transform mt-auto">
                Get Started
              </Link>
            </div>

            {/* App + Landing Page */}
            <div className="bg-orange-600 text-white p-8 rounded-[2.5rem] border border-orange-500 flex flex-col text-left relative transform md:-translate-y-4 shadow-2xl shadow-orange-600/20">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Store className="w-24 h-24" />
              </div>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950 text-white text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full border border-neutral-800">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 relative z-10">App + Website</h3>
              <p className="text-orange-200 mb-6 flex-1 relative z-10">App + Restaurant Landing Page maintained by us.</p>
              <div className="flex items-baseline gap-2 mb-8 relative z-10">
                <span className="text-5xl font-extrabold">₹599</span>
                <span className="text-orange-200">/mo + GST</span>
              </div>
              <div className="space-y-4 mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="font-medium text-sm">Everything in App Only</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="font-medium text-sm">Custom Landing Page</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="font-medium text-sm">SEO Optimization</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                  <span className="font-medium text-sm">Maintained by our team</span>
                </div>
              </div>
              <Link href="/signup" className="block w-full text-center px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:scale-105 transition-transform mt-auto relative z-10">
                Start Building
              </Link>
            </div>

            {/* App + Landing Page + SMM */}
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 flex flex-col text-left">
              <h3 className="text-2xl font-bold mb-2">Growth Plan</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 flex-1">App + Landing page + Social Media Marketing.</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-extrabold">₹1499</span>
                <span className="text-neutral-500">/mo + GST</span>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Everything in Website plan</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Social Media Management</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Ad Campaigns Setup</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="font-medium text-sm">Growth Consulting</span>
                </div>
              </div>
              <Link href="/signup" className="block w-full text-center px-8 py-4 bg-neutral-200 dark:bg-neutral-800 text-black dark:text-white font-bold rounded-xl hover:scale-105 transition-transform mt-auto">
                Scale Your Business
              </Link>
            </div>

          </div>
        </section>
      </main>

      <footer className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">
              O
            </div>
            <span className="font-bold text-neutral-900 dark:text-white">OmniServe</span>
          </div>
          <p>© {new Date().getFullYear()} OmniServe. Built for the modern restaurant.</p>
        </div>
      </footer>
    </div>
  );
}
