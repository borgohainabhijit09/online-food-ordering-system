'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Percent, Gift, ChevronRight, PlayCircle, Star, BadgeCheck, Smartphone, MapPin, BarChart3, LayoutList, Database, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import ROICalculator from '@/components/ROICalculator';
import FAQ from '@/components/FAQ';
import AnimatedMockup from '@/components/AnimatedMockup';
import CompetitorTable from '@/components/CompetitorTable';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 font-sans selection:bg-orange-200 dark:selection:bg-orange-900/30">

      {/* Announcement Banner */}
      <div className="bg-orange-600 text-white text-sm font-medium py-2 px-4 text-center">
        <span className="flex items-center justify-center gap-2">
          🎉 <span className="hidden sm:inline">Early Access Offer:</span> First 100 Restaurants Get Locked-In Pricing at ₹499/month
        </span>
      </div>

      {/* Header */}
      <header className="sticky top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-extrabold shadow-sm shadow-orange-600/20">
              R
            </div>
            <span className="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">RestoBuddy</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link href="/admin/login" className="text-xs sm:text-sm font-semibold whitespace-nowrap text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white px-3 py-2 sm:px-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all">
              Restaurant Login
            </Link>
            <Link href="/signup" className="text-xs sm:text-sm font-bold whitespace-nowrap bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 sm:px-6 sm:py-2.5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-neutral-900/10">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Economic Proof Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-400 py-3 text-center text-sm md:text-base font-medium px-4">
          <span className="font-bold">Fact:</span> A single direct order can pay for your monthly subscription (₹499/month).
        </div>

        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl -z-10"></div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium text-sm mb-8 border border-orange-200 dark:border-orange-800/30"
          >
            <BadgeCheck className="w-4 h-4" /> Your Restaurant's Digital Buddy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-neutral-900 dark:text-white leading-[1.1]"
          >
            Get More Direct Orders.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Keep More Profit.</span>
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
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
          >
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white font-bold text-lg rounded-full hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/20 transition-all flex items-center justify-center gap-2 active:scale-95">
              Start 15-Day Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo-restaurant" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-lg rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 active:scale-95">
              <PlayCircle className="w-5 h-5 text-neutral-400" /> View Demo
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
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> No Tech Skills Needed</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cancel Anytime</span>
          </motion.div>
        </section>

        {/* Animated Mockup Section */}
        <section className="py-12 bg-neutral-50 dark:bg-neutral-900/50 border-y border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">The Direct Ordering Flywheel</h2>
            </div>
            <AnimatedMockup />
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="py-24 bg-white dark:bg-neutral-950 relative border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Calculate Your Savings</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                See exactly how much money you are leaving on the table every month by not accepting direct orders.
              </p>
            </div>
            <ROICalculator />
          </div>
        </section>

        {/* Competitor Comparison Section */}
        <section className="py-24 bg-neutral-50 dark:bg-neutral-900/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">RestoBuddy vs Delivery Apps</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Why paying massive commissions doesn't make sense for your repeat customers.
              </p>
            </div>
            <CompetitorTable />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-white dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">How It Works</h2>
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
                  className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-center relative"
                >
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4 text-lg">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-neutral-900 dark:text-white">{s.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-neutral-50 dark:bg-neutral-900/30 border-y border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to grow.</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Powerful tools designed specifically for Indian restaurants.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Smartphone, title: 'WhatsApp Orders', desc: 'Receive structured orders instantly.' },
                { icon: Gift, title: 'Coupons & Discounts', desc: 'Bring customers back automatically.' },
                { icon: Database, title: 'Customer Database', desc: 'Own your customer relationships.' },
                { icon: MapPin, title: 'Delivery Zone Control', desc: 'Accept only orders you can deliver.' },
                { icon: LayoutList, title: 'Inventory Management', desc: 'Never sell unavailable items.' },
                { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Know exactly what\'s working.' },
                { icon: Users, title: 'Loyalty & Repeat Orders', desc: 'Turn first-time buyers into regulars.' }
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-neutral-950 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-lg transition-shadow"
                >
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center rounded-2xl mb-6">
                    <f.icon className="w-6 h-6" />
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

        {/* Built For Restaurants Like Section */}
        <section className="py-24 bg-white dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Built For Restaurants Like Yours</h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-16">
              RestoBuddy powers hundreds of independent food businesses across India.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { icon: "🍛", name: "Biryani Shops" },
                { icon: "☕", name: "Cafes" },
                { icon: "🍔", name: "Fast Food" },
                { icon: "🥐", name: "Bakeries" },
                { icon: "🥟", name: "Momos Shops" },
                { icon: "🏠", name: "Cloud Kitchens" }
              ].map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 flex flex-col items-center justify-center hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors cursor-default"
                >
                  <span className="text-5xl mb-4">{cat.icon}</span>
                  <span className="font-bold text-lg text-neutral-900 dark:text-white">{cat.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-3xl p-8 flex flex-wrap justify-center gap-6 md:gap-12 text-center text-emerald-800 dark:text-emerald-400 font-bold text-sm md:text-base shadow-lg shadow-emerald-900/5">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> 15-Day Free Trial</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Setup in Under 15 Min</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> No Setup Fee</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Indian Support</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Cancel Anytime</div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" id="pricing">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 flex flex-col text-left shadow-sm">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <p className="text-neutral-500 dark:text-neutral-400 mb-6 flex-1">Everything you need to accept direct online orders.</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black tracking-tight">₹499</span>
                <span className="text-neutral-500 font-medium">/month</span>
              </div>
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Digital Menu & Ordering Link</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">WhatsApp Order Notifications</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Coupons & Discount Engine</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-neutral-700 dark:text-neutral-300">Zero Commission on Orders</span>
                </div>
              </div>
              <Link href="/signup?plan=Starter" className="block w-full text-center px-8 py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-bold rounded-2xl transition-all mt-auto">
                Start 15-Day Free Trial
              </Link>
            </div>

            {/* Growth Plan */}
            <div className="bg-neutral-900 dark:bg-neutral-950 p-10 rounded-[2.5rem] border border-neutral-800 flex flex-col text-left relative shadow-2xl shadow-neutral-900/20 transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full shadow-lg shadow-orange-500/20">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Growth</h3>
              <p className="text-neutral-400 mb-6 flex-1">Starter + Custom Landing Page for your restaurant.</p>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-black tracking-tight text-white">₹599</span>
                <span className="text-neutral-400 font-medium">/month</span>
              </div>
              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-neutral-300">Everything in Starter</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <span className="font-medium text-neutral-300">Custom Landing Page & Hosting</span>
                </div>

              </div>
              <Link href="/signup?plan=Growth" className="block w-full text-center px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-all mt-auto shadow-lg shadow-orange-600/20">
                Start 15-Day Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-neutral-50 dark:bg-neutral-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
            </div>
            <FAQ />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-600 -z-10"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black mb-6 tracking-tight"
            >
              Every day you wait, you're paying commissions on orders that could be yours.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto font-medium"
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
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-orange-900/20">
                Start 15-Day Free Trial
              </Link>
              <Link href="/demo-restaurant" className="w-full sm:w-auto px-8 py-4 bg-orange-700/50 hover:bg-orange-700 text-white border border-orange-500 font-bold text-lg rounded-full hover:scale-105 transition-transform active:scale-95">
                View Demo
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-neutral-950 border-t border-neutral-900 py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-neutral-400">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white font-extrabold text-sm">
              R
            </div>
            <span className="font-bold text-xl tracking-tight text-white">RestoBuddy</span>
          </div>
          <p className="mb-4">Your Restaurant's Digital Buddy.</p>
          <p className="text-sm">© {new Date().getFullYear()} RestoBuddy. Built for the modern Indian restaurant.</p>
        </div>
      </footer>
    </div>
  );
}
