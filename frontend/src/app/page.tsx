'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Percent, Gift, PlayCircle, Star, BadgeCheck, Smartphone, MapPin, BarChart3, LayoutList, Database, Loader2, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ROICalculator from '@/components/ROICalculator';
import FAQ from '@/components/FAQ';
import AnimatedMockup from '@/components/AnimatedMockup';
import CompetitorTable from '@/components/CompetitorTable';

interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  description: string | null;
  isActive: boolean;
  planFeatures: Array<{ feature: Feature }>;
}

export default function LandingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`/api/plans`);
        if (res.ok) {
          const data = await res.json();
          // Filter only active plans
          setPlans(data.filter((p: Plan) => p.isActive));
        }
      } catch (e) {
        console.error("Failed to fetch plans", e);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] font-sans selection:bg-orange-500/30">

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-rose-600 text-white text-sm font-medium py-2.5 px-4 text-center">
        <span className="flex items-center justify-center gap-2">
          🎉 <span className="hidden sm:inline">Early Access Offer:</span> First 100 Restaurants Get Locked-In Pricing
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-lg shadow-orange-600/20">
              R
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">RestoBuddy</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-neutral-600 dark:text-neutral-300">
            <Link href="#features" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Pricing</Link>
            <Link href="/demo-restaurant" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Demo</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3 sm:gap-5 shrink-0">
            <Link href="/admin/login" className="text-xs sm:text-sm font-semibold whitespace-nowrap text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-3 py-2 sm:px-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
              Restaurant Login
            </Link>
            <Link href="/signup" className="text-xs sm:text-sm font-bold whitespace-nowrap bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-neutral-900/10 dark:shadow-white/10">
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-neutral-600 dark:text-neutral-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-white/10 shadow-xl flex flex-col p-4 gap-4"
            >
              <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral-900 dark:text-white py-2">Features</Link>
              <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral-900 dark:text-white py-2">Pricing</Link>
              <Link href="/demo-restaurant" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral-900 dark:text-white py-2">Demo</Link>
              <div className="h-px bg-neutral-200 dark:bg-white/10 my-2" />
              <Link href="/admin/login" onClick={() => setIsMobileMenuOpen(false)} className="font-semibold text-neutral-900 dark:text-white py-2 text-center border border-neutral-200 dark:border-white/20 rounded-xl">
                Restaurant Login
              </Link>
              <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-white bg-orange-600 py-3 text-center rounded-xl shadow-lg shadow-orange-600/20">
                Start Free Trial
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>
        {/* Economic Proof Banner */}
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 dark:text-emerald-400 py-3 text-center text-sm md:text-base font-medium px-4 backdrop-blur-sm">
          <span className="font-bold">Fact:</span> A single direct order can pay for your monthly subscription.
        </div>

        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-36 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Animated Background Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl pointer-events-none -z-10">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-96 h-96 bg-orange-500/20 dark:bg-orange-500/10 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-rose-500/20 dark:bg-rose-500/10 rounded-full blur-[120px]"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-neutral-200/50 dark:border-white/10 text-neutral-800 dark:text-neutral-300 font-semibold text-sm mb-8 shadow-sm backdrop-blur-md"
          >
            <BadgeCheck className="w-4 h-4 text-orange-500" /> Your Restaurant's Digital Buddy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 text-neutral-900 dark:text-white leading-[1.05]"
          >
            Get More Direct Orders.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Keep More Profit.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Stop losing customers and profits to delivery apps. Get your own ordering system, receive orders directly on WhatsApp, and turn one-time customers into regular customers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 active:scale-95">
              Start 15-Day Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo-restaurant" className="w-full sm:w-auto px-8 py-4 bg-white/80 dark:bg-white/5 backdrop-blur-md border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white font-bold text-lg rounded-full hover:bg-neutral-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 active:scale-95">
              <PlayCircle className="w-5 h-5 text-neutral-500 dark:text-neutral-400" /> View Demo
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4 md:gap-8 text-sm font-semibold text-neutral-600 dark:text-neutral-400"
          >
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Setup in 15 Minutes</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Setup Fee</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel Anytime</span>
          </motion.div>
        </section>

        {/* Animated Mockup Section */}
        <section className="py-20 bg-white/50 dark:bg-white/[0.02] border-y border-neutral-200/50 dark:border-white/5 backdrop-blur-3xl overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">The Direct Ordering Flywheel</h2>
            </div>
            <AnimatedMockup />
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Calculate Your Savings</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                See exactly how much money you are leaving on the table every month by not accepting direct orders.
              </p>
            </div>
            <ROICalculator />
          </div>
        </section>

        {/* Competitor Comparison Section */}
        <section className="py-32 bg-white/50 dark:bg-white/[0.02] border-y border-neutral-200/50 dark:border-white/5 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">RestoBuddy vs Delivery Apps</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Why paying massive commissions doesn't make sense for your repeat customers.
              </p>
            </div>
            <CompetitorTable />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">How It Works</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                We made it incredibly simple to get started. No technical skills needed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { step: 1, title: 'Upload Menu', desc: 'Add items & prices.' },
                { step: 2, title: 'Get Link', desc: 'Share on socials.' },
                { step: 3, title: 'Customers Order', desc: 'Directly from phone.' },
                { step: 4, title: 'Receive on WhatsApp', desc: 'Instantly notified.' },
                { step: 5, title: 'Build Customers', desc: 'Drive repeat sales.' }
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="bg-white/70 dark:bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-neutral-200/50 dark:border-white/10 text-center relative shadow-xl shadow-black/5"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-6 text-xl shadow-lg shadow-orange-500/30">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-neutral-900 dark:text-white">{s.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-white/50 dark:bg-white/[0.02] border-y border-neutral-200/50 dark:border-white/5 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Everything you need to grow.</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Powerful tools designed specifically for independent restaurants.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Smartphone, title: 'WhatsApp Orders', desc: 'Receive structured, easy-to-read orders instantly on your phone.' },
                { icon: Gift, title: 'Coupons & Discounts', desc: 'Create promotional campaigns to bring customers back automatically.' },
                { icon: Database, title: 'Customer Database', desc: 'Own your customer data and relationships, unlike delivery apps.' },
                { icon: MapPin, title: 'Delivery Zone Control', desc: 'Set minimum order values and delivery radii with ease.' },
                { icon: LayoutList, title: 'Inventory Management', desc: 'Mark items out of stock instantly so you never oversell.' },
                { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Know exactly what\'s selling and track your real growth.' }
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2rem] border border-neutral-200/50 dark:border-white/10 shadow-xl shadow-black/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all group"
                >
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-neutral-900 dark:text-white">{f.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Pricing Section */}
        <section className="py-32 relative" id="pricing">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Simple, Transparent Pricing</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                No hidden fees, no commissions per order. Just a flat monthly rate.
              </p>
            </div>

            {loadingPlans ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
                <p className="text-neutral-500 font-medium">Loading plans...</p>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row flex-wrap items-stretch justify-center gap-8 max-w-[80rem] mx-auto">
                {plans.map((plan, i) => {
                  const isPopular = i === 1 || (plans.length === 1 && false); // Highlight second plan if available
                  
                  return (
                    <motion.div 
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15 }}
                      className={`relative flex flex-col text-left rounded-[2.5rem] p-10 w-full md:w-[350px] lg:w-[380px] shrink-0 ${
                        isPopular 
                          ? 'bg-gradient-to-b from-neutral-900 to-[#0a0a0a] dark:from-white/10 dark:to-white/5 border border-neutral-800 dark:border-white/20 shadow-2xl shadow-orange-500/20 md:-translate-y-4' 
                          : 'bg-white/70 dark:bg-white/[0.02] backdrop-blur-xl border border-neutral-200/50 dark:border-white/10 shadow-xl shadow-black/5'
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-5 rounded-full shadow-lg shadow-orange-500/30">
                          Most Popular
                        </div>
                      )}
                      
                      <h3 className={`text-2xl font-bold mb-2 ${isPopular ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                        {plan.name}
                      </h3>
                      <p className={`mb-8 flex-1 ${isPopular ? 'text-neutral-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {plan.description || 'Everything you need to grow.'}
                      </p>
                      
                      <div className={`flex items-baseline gap-2 mb-10 ${isPopular ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>
                        <span className="text-5xl font-black tracking-tighter">₹{plan.monthlyPrice}</span>
                        <span className={`font-medium ${isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}>/month</span>
                      </div>
                      
                      <div className="space-y-4 mb-12">
                        {plan.planFeatures.map((pf) => (
                          <div key={pf.feature.id} className="flex items-start gap-3">
                            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${isPopular ? 'text-orange-500' : 'text-emerald-500'}`} />
                            <span className={`font-medium ${isPopular ? 'text-neutral-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                              {pf.feature.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <Link 
                        href={`/signup?plan=${plan.name}`} 
                        className={`block w-full text-center px-8 py-4 font-bold rounded-2xl transition-all mt-auto ${
                          isPopular
                            ? 'bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white shadow-lg shadow-orange-500/25'
                            : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white'
                        }`}
                      >
                        Start 15-Day Free Trial
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 bg-white/50 dark:bg-white/[0.02] border-y border-neutral-200/50 dark:border-white/5 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Frequently Asked Questions</h2>
            </div>
            <FAQ />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 md:py-40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-rose-700 -z-10"></div>
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-tight"
            >
              Stop paying commissions today.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl text-orange-100/90 mb-12 max-w-2xl mx-auto font-medium"
            >
              Start your free trial today and keep more profit from every order. Setup takes less than 15 minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/signup" className="w-full sm:w-auto px-10 py-5 bg-white text-orange-600 font-black text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-2xl shadow-orange-900/30">
                Start 15-Day Free Trial
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0a0a0a] py-20 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-rose-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">
                  R
                </div>
                <span className="font-bold text-2xl tracking-tight text-white">RestoBuddy</span>
              </div>
              <p className="text-neutral-400 mb-6 leading-relaxed">Your Restaurant's Digital Buddy. Build your brand, own your customers, and save on commissions.</p>
              <div className="text-sm text-neutral-500">
                <p>Powered by</p>
                <a href="https://sygmiainnovative.co.in/" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-400 font-semibold transition-colors">
                  Sygmia Innovative
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-white tracking-tight">Office Locations</h4>
              <ul className="space-y-3 text-neutral-400">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-orange-500">•</span>
                  <span>Bangalore, Karnataka-IN</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-orange-500">•</span>
                  <span>Tezpur, Assam-IN</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-orange-500">•</span>
                  <span>Dibrugarh, Assam-IN</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-white tracking-tight">Contact Us</h4>
              <div className="space-y-6 text-neutral-400">
                <div>
                  <p className="text-sm font-semibold text-neutral-300 mb-1">Email</p>
                  <a href="mailto:info@sygmiainnovative.co.in" className="hover:text-orange-400 transition-colors">info@sygmiainnovative.co.in</a>
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-300 mb-1">Call Us</p>
                  <p className="mb-1"><a href="tel:+917760133445" className="hover:text-orange-400 transition-colors">+91 77601 33445</a></p>
                  <p><a href="tel:+917002309306" className="hover:text-orange-400 transition-colors">+91 70023 09306</a></p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-bold mb-6 text-white tracking-tight">Quick Links</h4>
              <ul className="space-y-3 text-neutral-400">
                <li><Link href="/signup" className="hover:text-orange-400 transition-colors">Start Free Trial</Link></li>
                <li><Link href="/demo-restaurant" className="hover:text-orange-400 transition-colors">View Demo</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center text-neutral-500 text-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} RestoBuddy. Built for the modern Indian restaurant.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
