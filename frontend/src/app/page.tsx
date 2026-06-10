'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Percent, Gift, ChevronRight, PlayCircle, Star, BadgeCheck } from 'lucide-react';
import ROICalculator from '@/components/ROICalculator';
import FAQ from '@/components/FAQ';

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
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hidden sm:block text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-bold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-5 py-2.5 rounded-full hover:scale-105 transition-transform active:scale-95 shadow-lg shadow-neutral-900/10">
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 md:pt-32 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl -z-10"></div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium text-sm mb-8 border border-orange-200 dark:border-orange-800/30">
            <BadgeCheck className="w-4 h-4" /> Your Restaurant's Digital Buddy
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 text-neutral-900 dark:text-white leading-[1.1]">
            Get More Direct Orders.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Keep More Profit.</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            RestoBuddy helps restaurants accept direct online orders, build customer relationships, and grow repeat business <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">without relying entirely on Swiggy or Zomato.</strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white font-bold text-lg rounded-full hover:bg-orange-700 hover:shadow-xl hover:shadow-orange-600/20 transition-all flex items-center justify-center gap-2 active:scale-95">
              Start 15-Day Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/demo-restaurant" className="w-full sm:w-auto px-8 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-lg rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 active:scale-95">
              <PlayCircle className="w-5 h-5 text-neutral-400" /> Watch Demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-500 font-medium flex items-center justify-center gap-2">
            ✓ No credit card required &nbsp; ✓ Cancel anytime &nbsp; ✓ 5-minute setup
          </p>
        </section>

        {/* Agitation / Problem Section */}
        <section className="bg-neutral-900 text-white py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Tired of paying 20-30% commissions?</h2>
            <p className="text-xl text-neutral-400 leading-relaxed mb-12">
              Every time a customer orders through a delivery app, you lose a massive chunk of your profit. You do the hard work of preparing the food, while they take the margin. It's time to take control of your customer base and keep the money you earn.
            </p>
          </div>
        </section>

        {/* ROI Calculator Section */}
        <section className="py-24 bg-neutral-50 dark:bg-neutral-950 relative">
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

        {/* Benefits Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Everything you need to grow.</h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                No complex software. No technical skills required. Just a simple system that brings you more direct orders.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center rounded-2xl mb-6">
                  <TrendingUp className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Stop Missing Out on Revenue</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Take unlimited orders directly through your own link. Keep 100% of the profits. Never sell items that are out of stock with our simple one-tap menu manager.
                </p>
              </div>

              {/* Benefit 2 */}
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center rounded-2xl mb-6">
                  <Gift className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Create Offers That Bring Customers Back</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Easily generate dynamic coupons and discounts. Run a "First Order Free Delivery" campaign or a "10% Off" weekend special to turn one-time buyers into regulars.
                </p>
              </div>

              {/* Benefit 3 */}
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center rounded-2xl mb-6">
                  <Users className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Turn Walk-ins Into Digital Customers</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Put your QR code on tables. Build a database of your loyal customers when they order. Send them WhatsApp updates with new offers to drive repeat business.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Placeholder */}
        <section className="py-24 bg-neutral-50 dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight">Restaurants Across India Are Growing With RestoBuddy</h2>
            <div className="grid md:grid-cols-3 gap-8 text-left">

              <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex gap-1 text-orange-500 mb-4">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-lg font-medium mb-6 text-neutral-800 dark:text-neutral-200">
                  "We saved over ₹15,000 in commissions just last month. Our customers love ordering directly from us via WhatsApp. It's incredibly easy to use."
                </p>
                <div>
                  <div className="font-bold">Rahul Sharma</div>
                  <div className="text-sm text-neutral-500">Owner, Sharma Food Corner • Pune</div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex gap-1 text-orange-500 mb-4">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-lg font-medium mb-6 text-neutral-800 dark:text-neutral-200">
                  "The coupon system is brilliant. I offered a flat ₹50 off on direct orders, and my repeat customer rate doubled in 3 weeks. RestoBuddy pays for itself."
                </p>
                <div>
                  <div className="font-bold">Anita Desai</div>
                  <div className="text-sm text-neutral-500">Founder, Anita's Bakehouse • Mumbai</div>
                </div>
              </div>

              <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex gap-1 text-orange-500 mb-4">
                  <Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" /><Star className="w-5 h-5 fill-current" />
                </div>
                <p className="text-lg font-medium mb-6 text-neutral-800 dark:text-neutral-200">
                  "I was tired of Swiggy hiding customer details. Now I know exactly who is buying my Biryani, and I can reach out to them directly. This is a game changer."
                </p>
                <div>
                  <div className="font-bold">Mohammed Ali</div>
                  <div className="text-sm text-neutral-500">Ali's Dum Biryani • Hyderabad</div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center" id="pricing">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">Simple Pricing. Huge ROI.</h2>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-16">
            Make your investment back with just one direct order.
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

            {/* Starter Plan */}
            <div className="bg-white dark:bg-neutral-900 p-10 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 flex flex-col text-left shadow-sm">
              <h3 className="text-2xl font-bold mb-2">RestoBuddy Starter</h3>
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
              <h3 className="text-2xl font-bold mb-2 text-white">RestoBuddy Growth</h3>
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

        {/* Risk Reversal Banner */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-6 md:p-8 flex flex-wrap justify-center gap-6 md:gap-12 text-center text-emerald-800 dark:text-emerald-400 font-medium text-sm md:text-base">
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> 15-Day Free Trial</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> No Credit Card Required</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> No Setup Fee</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Cancel Anytime</div>
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
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Ready To Get More Direct Orders?</h2>
            <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
              Start your free trial today and keep more profit from every single order. Setup takes less than 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl shadow-orange-900/20">
                Start Free Trial
              </Link>
              <Link href="/demo-restaurant" className="w-full sm:w-auto px-8 py-4 bg-orange-700/50 hover:bg-orange-700 text-white border border-orange-500 font-bold text-lg rounded-full hover:scale-105 transition-transform active:scale-95">
                Book a Demo
              </Link>
            </div>
            <p className="mt-6 text-sm text-orange-200">Join 100+ growing restaurants in India.</p>
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
