'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Percent, Gift, Star, BadgeCheck, Smartphone, MapPin, BarChart3, LayoutList, Database, Loader2, Menu, X, Building2, User2, PhoneCall, Mail, Check, Sparkles, MessageCircle, Monitor, Receipt, Utensils, Megaphone, MessageSquare, Sliders, Heart, Cpu, Bot, Brain, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import FAQ from '@/components/FAQ';

interface Feature {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Demo request state variables
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoFormData, setDemoFormData] = useState({
    restaurantName: '',
    ownerName: '',
    phone: '',
    email: '',
    city: ''
  });
  const [isSubmittingDemo, setIsSubmittingDemo] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoFormData.restaurantName || !demoFormData.ownerName || !demoFormData.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmittingDemo(true);
    try {
      const res = await apiClient.post('/api/auth/demo-request', demoFormData);
      if (res.ok) {
        setDemoSubmitted(true);
        toast.success("Demo request submitted successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to submit demo request.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmittingDemo(false);
    }
  };

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
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-6 text-neutral-900 dark:text-white leading-[1.05]"
          >
            Increase Repeat Customers.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Reduce Delivery Commissions.</span><br />
            <span className="text-neutral-800 dark:text-neutral-100">Grow Your Restaurant.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-neutral-600 dark:text-neutral-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            RestoBuddy is the Restaurant Operating System that helps independent restaurants own their customers, automate operations, and grow profitably.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <button
              onClick={() => setIsDemoModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold text-lg rounded-full hover:shadow-2xl hover:shadow-orange-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              Book a Free Demo <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Trust Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 border-t border-neutral-200/50 dark:border-white/5 pt-10"
          >
            <p className="text-sm font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-6">
              Trusted by growing restaurants
            </p>
            <div className="flex flex-wrap justify-center items-center gap-4 max-w-4xl mx-auto px-4">
              {[
                'Direct Ordering',
                'WhatsApp Ordering',
                'QR Menu',
                'Billing & POS',
                'Kitchen Management',
                'Customer Loyalty'
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-neutral-800 dark:text-neutral-200 font-bold bg-white/60 dark:bg-white/[0.03] border border-neutral-200/50 dark:border-white/10 px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform duration-200">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                  <span className="text-sm md:text-base tracking-tight">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

        </section>

        {/* Section 2: Problem & OS Solution */}
        <section className="py-24 md:py-32 bg-white dark:bg-[#080808] border-b border-neutral-200/50 dark:border-white/5 relative overflow-hidden">
          {/* Subtle Background Glows */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

              {/* Left Column: Heading and Problem Copy */}
              <div className="lg:col-span-6 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-sm">
                    Operating System
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mt-2 leading-tight">
                    Restaurants Don't Need More Apps.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                      They Need One Operating System.
                    </span>
                  </h2>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="space-y-4 text-base md:text-lg text-neutral-600 dark:text-neutral-400 font-medium"
                >
                  <p className="leading-relaxed">
                    Running a restaurant today means juggling multiple tools:
                  </p>
                  <p className="text-red-500/90 dark:text-red-400 font-bold border-l-2 border-red-500 pl-4 py-1">
                    It wastes time, creates confusion, and reduces profits.
                  </p>
                  <p className="text-neutral-800 dark:text-neutral-200 font-bold text-lg pt-2 leading-relaxed">
                    RestoBuddy brings everything together in one intelligent platform built specifically for restaurants.
                  </p>
                </motion.div>
              </div>

              {/* Right Column: Juggling Tools Grid */}
              <div className="lg:col-span-6">
                <div className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-6 text-center lg:text-left">
                  Juggling Multiple Tools Daily:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { title: 'Food delivery apps', icon: Smartphone, color: 'from-blue-500/20 to-indigo-500/20 text-indigo-500' },
                    { title: 'WhatsApp ordering', icon: MessageCircle, color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500' },
                    { title: 'Phone orders', icon: PhoneCall, color: 'from-cyan-500/20 to-sky-500/20 text-cyan-500' },
                    { title: 'POS software', icon: Monitor, color: 'from-orange-500/20 to-amber-500/20 text-orange-500' },
                    { title: 'Billing & receipts', icon: Receipt, color: 'from-rose-500/20 to-pink-500/20 text-rose-500' },
                    { title: 'Kitchen operations', icon: Utensils, color: 'from-violet-500/20 to-purple-500/20 text-purple-500' },
                    { title: 'Customer databases', icon: Users, color: 'from-yellow-500/20 to-amber-500/20 text-yellow-500' },
                    { title: 'Marketing campaigns', icon: Megaphone, color: 'from-red-500/20 to-orange-500/20 text-red-500' }
                  ].map((tool, index) => {
                    const IconComponent = tool.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 hover:border-orange-500/50 dark:hover:border-orange-500/30 transition-all duration-300 shadow-sm group hover:-translate-y-1"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className="text-sm md:text-base font-bold text-neutral-800 dark:text-neutral-200">
                          {tool.title}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </section>


        {/* Section 3: Why Restaurant Owners Choose RestoBuddy */}
        <section className="py-24 md:py-32 bg-slate-50 dark:bg-[#0a0a0a] relative overflow-hidden">
          {/* Decorative glows */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-80 bg-gradient-to-t from-orange-500/5 to-transparent blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
              <span className="text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-sm">
                Value Proposition
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mt-2 mb-4">
                Why Restaurant Owners Choose RestoBuddy
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Supercharge your restaurant growth and take control of your operation from one unified dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

              {/* Card 1: Own Your Customers */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-black/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    Own Your Customers
                  </h3>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-500 mb-2">
                    Stop depending entirely on marketplaces.
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                    Build your own customer database, collect customer insights, and create long-term relationships.
                  </p>
                </div>
              </motion.div>

              {/* Card 2: Increase Repeat Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-black/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    Increase Repeat Orders
                  </h3>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-500 mb-2">
                    Drive loyal, repeat business.
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                    Turn first-time customers into loyal regulars using loyalty programs, promotions, and automated engagement.
                  </p>
                </div>
              </motion.div>

              {/* Card 3: Sell Directly on WhatsApp */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-black/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    Sell Directly on WhatsApp
                  </h3>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-500 mb-2">
                    No app download required.
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                    Let customers browse your menu, place orders, and receive updates—all through WhatsApp.
                  </p>
                </div>
              </motion.div>

              {/* Card 4: Simplify Daily Operations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-black/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sliders className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    Simplify Daily Operations
                  </h3>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-500 mb-2">
                    One unified kitchen command center.
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                    Manage orders, billing, kitchen workflows, inventory, staff, and reports from one dashboard.
                  </p>
                </div>
              </motion.div>

              {/* Card 5: Make Better Business Decisions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-white/[0.02] border border-neutral-200/60 dark:border-white/5 p-8 rounded-[2rem] shadow-xl shadow-black/5 hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    Make Better Decisions
                  </h3>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-500 mb-2">
                    Know what's working instantly.
                  </p>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm md:text-base">
                    Track sales, customer behavior, and business performance with real-time insights.
                  </p>
                </div>
              </motion.div>

              {/* Card 6: Interactive CTA Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-orange-600 to-rose-600 p-8 rounded-[2rem] shadow-xl shadow-orange-500/25 flex flex-col justify-between text-white hover:-translate-y-1.5 transition-all duration-300"
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-black leading-tight">
                    Ready to grow your restaurant?
                  </h3>
                  <p className="text-orange-100/90 text-sm leading-relaxed">
                    Set up your digital operating system in under 15 minutes with RestoBuddy. No credit card required.
                  </p>
                </div>
                <div className="pt-8">
                  <button
                    onClick={() => setIsDemoModalOpen(true)}
                    className="w-full py-3 bg-white text-orange-600 font-bold rounded-2xl shadow-lg hover:bg-neutral-50 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Book a Free Demo <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>

            </div>
          </div>
        </section>


        {/* Section 6: Why RestoBuddy Is Different */}
        <section className="py-24 md:py-32 bg-slate-50 dark:bg-[#0a0a0a] border-b border-neutral-200/50 dark:border-white/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <span className="text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-sm">
                Comparison
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mt-2 mb-4">
                Why RestoBuddy Is Different
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Unlike standard restaurant software that only focuses on billing, we are built to grow your business.
              </p>
            </div>

            <div className="w-full overflow-hidden rounded-[2.5rem] border border-neutral-200 dark:border-white/10 shadow-2xl bg-white dark:bg-[#0c0d12]">
              {/* Table Header */}
              <div className="grid grid-cols-2 bg-neutral-100 dark:bg-white/5 border-b border-neutral-200 dark:border-white/10 text-center font-bold text-lg md:text-xl">
                <div className="p-6 text-neutral-500 dark:text-neutral-400">
                  Others
                </div>
                <div className="p-6 text-orange-600 dark:text-orange-500 border-l border-neutral-200 dark:border-white/10 bg-orange-50/50 dark:bg-orange-500/5 font-black">
                  RestoBuddy
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-neutral-200 dark:divide-white/10">
                {[
                  { others: 'Separate tools', us: 'One complete operating system' },
                  { others: 'Focus on billing', us: 'Focus on business growth' },
                  { others: 'Limited customer ownership', us: 'Own your customer database' },
                  { others: 'Manual marketing', us: 'Smart automation' },
                  { others: 'Static reports', us: 'AI-powered insights' },
                  { others: 'Software vendor', us: 'Growth partner' }
                ].map((row, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.08 }}
                    className="grid grid-cols-2 text-center items-center hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Left: Others */}
                    <div className="p-6 text-neutral-500 dark:text-neutral-400 font-medium text-sm md:text-base">
                      {row.others}
                    </div>
                    {/* Right: RestoBuddy */}
                    <div className="p-6 border-l border-neutral-200 dark:border-white/10 bg-orange-50/20 dark:bg-orange-500/[0.02] text-neutral-900 dark:text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                      <span>{row.us}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Section 4: Grouped Features - Everything You Need to Run a Modern Restaurant */}
        <section id="features" className="py-24 md:py-32 bg-white/50 dark:bg-white/[0.02] border-y border-neutral-200/50 dark:border-white/5 backdrop-blur-3xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <span className="text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-sm">
                Features
              </span>
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter text-neutral-900 dark:text-white mt-2">
                Everything You Need to Run a Modern Restaurant
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
                Ditch the paperwork. Streamline operations and drive sales with our fully-integrated restaurant ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {/* Category 1: Customer Experience */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2.5rem] border border-neutral-200/50 dark:border-white/10 shadow-xl shadow-black/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Customer Experience
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Digital QR Menu', desc: 'Sleek dine-in menus with instant scan-to-order.' },
                    { name: 'Online Ordering', desc: 'Accept direct orders with custom branded storefronts.' },
                    { name: 'WhatsApp Ordering', desc: 'Receive, track, and notify order status directly via WhatsApp.' },
                    { name: 'Loyalty Programs', desc: 'Reward regular customers with flexible loyalty point rules.' },
                    { name: 'Customer Database', desc: 'Secure database to own and segment customer contact details.' },
                    { name: 'Reviews & Feedback', desc: 'Collect instant post-dine ratings and privately resolve issues.' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors duration-200">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm md:text-base leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Category 2: Restaurant Operations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2.5rem] border border-neutral-200/50 dark:border-white/10 shadow-xl shadow-black/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Restaurant Operations
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'POS & Billing', desc: 'Lightning-fast checkout with digital invoices and KOT creation.' },
                    { name: 'Kitchen Display', desc: 'Interactive kitchen screen managing real-time status.' },
                    { name: 'Order Management', desc: 'Single panel tracking dine-in, takeaway, and delivery orders.' },
                    { name: 'Inventory', desc: 'Track raw materials, recipes, and auto-deduction on sales.' },
                    { name: 'Staff Management', desc: 'Role-based access permissions for servers, managers, and cashiers.' },
                    { name: 'Expense Tracking', desc: 'Log operational costs to analyze your true net profit.' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors duration-200">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm md:text-base leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Category 3: Business Growth */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl p-8 rounded-[2.5rem] border border-neutral-200/50 dark:border-white/10 shadow-xl shadow-black/5 hover:bg-white dark:hover:bg-white/[0.05] transition-all duration-300 group"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Business Growth
                  </h3>
                </div>

                <div className="space-y-4">
                  {[
                    { name: 'Marketing Campaigns', desc: 'Send bulk SMS and WhatsApp promo notifications in a click.' },
                    { name: 'Customer Segmentation', desc: 'Identify VIPs and inactive diners to run custom target ads.' },
                    { name: 'Promotions', desc: 'Generate discount vouchers and dynamic coupon rules easily.' },
                    { name: 'Analytics Dashboard', desc: 'View top sellers, busy hours, and store performance trends.' },
                    { name: 'Sales Reports', desc: 'Download GST reports, cashier closures, and product margins.' },
                    { name: 'AI Recommendations', desc: 'Intelligent suggestions on inventory re-orders and menu pricing.' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors duration-200">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm md:text-base leading-tight">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

            </div>
          </div>
        </section>

        {/* Section 5: Meet Your AI Restaurant Assistant */}
        <section className="py-24 md:py-32 bg-[#090a0f] text-white relative overflow-hidden border-y border-neutral-900">
          {/* Custom Glows */}
          <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

              {/* Left Column: AI Mockup Interface */}
              <div className="lg:col-span-6 order-last lg:order-first">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#0b0c10] border border-violet-500/20 rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-purple-500/5 relative overflow-hidden font-mono text-xs md:text-sm"
                >
                  {/* Top Glowing Edge */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent" />

                  {/* Terminal Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-violet-400" />
                      <span className="text-violet-400 font-bold uppercase tracking-widest text-[10px]">RestoBuddy AI v1.0</span>
                    </div>
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>

                  {/* Simulated Chat Feed */}
                  <div className="space-y-4 font-sans">
                    <div className="flex flex-col items-end">
                      <span className="text-neutral-500 text-[10px] mb-1 font-mono">Customer (WhatsApp)</span>
                      <div className="bg-neutral-800/80 text-neutral-200 px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed text-sm">
                        Hey, I want to order a Spicy Chicken Burger. Does it contain peanuts?
                      </div>
                    </div>

                    <div className="flex flex-col items-start">
                      <span className="text-violet-400 text-[10px] mb-1 font-mono">RestoBuddy AI Agent</span>
                      <div className="bg-violet-950/30 border border-violet-500/10 text-violet-200 px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] space-y-2 leading-relaxed text-sm">
                        <p>Hi! Great choice. Our Spicy Chicken Burger does <span className="text-emerald-400 font-bold">NOT</span> contain peanuts. 🍔</p>
                        <p>Would you like to add a side of Peri-Peri Fries for just ₹60?</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-neutral-500 text-[10px] mb-1 font-mono">Customer (WhatsApp)</span>
                      <div className="bg-neutral-800/80 text-neutral-200 px-4 py-2.5 rounded-2xl rounded-tr-none max-w-[85%] leading-relaxed text-sm">
                        Yes please! Deliver it to Flat 404, Tezpur.
                      </div>
                    </div>

                    <div className="flex flex-col items-start">
                      <span className="text-violet-400 text-[10px] mb-1 font-mono">RestoBuddy AI Agent</span>
                      <div className="bg-violet-950/30 border border-violet-500/10 text-violet-200 px-4 py-3 rounded-2xl rounded-tl-none max-w-[85%] leading-relaxed text-sm">
                        Placed! Your order is sent directly to the kitchen. Total: ₹240. I will send your order tracking link shortly. 🚀
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: AI Details & Checklist */}
              <div className="lg:col-span-6 space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> Coming Soon
                  </div>

                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                    Meet Your AI<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-rose-400">
                      Restaurant Assistant
                    </span>
                  </h2>

                  <p className="text-lg text-neutral-400 leading-relaxed font-medium">
                    Imagine having an AI assistant that works 24×7. This is the future we're building with RestoBuddy AI.
                  </p>
                </motion.div>

                <div className="space-y-4">
                  <div className="text-sm font-bold uppercase tracking-wider text-neutral-500">
                    What RestoBuddy AI can do:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      'Take orders on WhatsApp',
                      'Answer customer questions',
                      'Recommend dishes',
                      'Send promotional campaigns',
                      'Recover abandoned orders',
                      'Generate daily business reports',
                      'Help increase repeat customers'
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                        <span className="text-sm md:text-base font-bold text-neutral-200">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Section 7: Built for Every Kind of Restaurant */}
        <section className="py-24 md:py-32 bg-white dark:bg-[#080808] border-b border-neutral-200/50 dark:border-white/5 relative overflow-hidden">
          {/* Subtle details */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
              <span className="text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-sm">
                Versatility
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mt-2 mb-4">
                Built for Every Kind of Restaurant
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Whether you run a single local shop or a multi-location franchise, RestoBuddy fits your flow.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { title: 'Fine Dining', emoji: '🍽', desc: 'Table-side ordering & billing' },
                { title: 'Café', emoji: '☕', desc: 'Express ordering & loyalty reward points' },
                { title: 'Quick Service Restaurant', emoji: '🍔', desc: 'Scan-to-order & rapid billing terminal' },
                { title: 'Cloud Kitchen', emoji: '🥡', desc: 'Direct WhatsApp integration & dispatch tracking' },
                { title: 'Multi-Outlet Chain', emoji: '🥗', desc: 'Centralized inventory & analytics reporting' },
                { title: 'Takeaway', emoji: '🍕', desc: 'Quick self-collect and delivery zone rules' }
              ].map((restaurant, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="bg-white dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/5 hover:border-orange-500/40 p-6 md:p-8 rounded-[2rem] shadow-xl shadow-black/5 flex flex-col items-center text-center group hover:-translate-y-1.5 transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform shadow-inner shadow-black/5 dark:shadow-white/5">
                    {restaurant.emoji}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white mb-2">
                    {restaurant.title}
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    {restaurant.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mt-16 md:mt-20"
            >
              <div className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-orange-500/10 to-rose-500/10 dark:from-orange-500/5 dark:to-rose-500/5 border border-orange-500/20 dark:border-white/10 rounded-full font-bold text-lg text-orange-600 dark:text-orange-400">
                RestoBuddy adapts to your business.
              </div>
            </motion.div>

          </div>
        </section>


        {/* Section 8: What Restaurant Owners Care About */}
        <section className="py-24 md:py-32 bg-[#090a0f] text-white relative overflow-hidden border-y border-neutral-900">
          {/* Custom subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-orange-600/5 rounded-full blur-[140px] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

              {/* Left Column: Title & Final Statement */}
              <div className="lg:col-span-5 space-y-6">
                <span className="text-orange-500 font-bold uppercase tracking-wider text-sm">
                  Focus & Outcomes
                </span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  What Restaurant Owners Care About
                </h2>
                <p className="text-lg text-neutral-400 leading-relaxed font-medium">
                  We built our entire platform around the metrics that define your success.
                </p>
                <div className="pt-4">
                  <div className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-rose-600 rounded-2xl font-extrabold text-lg text-white shadow-lg shadow-orange-500/20">
                    That's exactly what RestoBuddy delivers.
                  </div>
                </div>
              </div>

              {/* Right Column: Outcomes Cards List */}
              <div className="lg:col-span-7 space-y-4">
                {[
                  'More Repeat Customers',
                  'More Direct Orders',
                  'Less Marketplace Dependency',
                  'Better Customer Relationships',
                  'Higher Profits',
                  'Simpler Operations',
                  'Smarter Decisions'
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.08] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <span className="font-extrabold text-base md:text-lg text-neutral-200 group-hover:text-white transition-colors">
                        {item}
                      </span>
                    </div>
                    <div className="text-xs text-orange-500 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Delivered →
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        </section>

        {/* Section 9: Customer Success Stories */}
        <section className="py-24 md:py-32 bg-white dark:bg-[#080808] border-b border-neutral-200/50 dark:border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
              <span className="text-orange-600 dark:text-orange-500 font-bold uppercase tracking-wider text-sm">
                Testimonials
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white mt-2 mb-4">
                Customer Success Stories
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                Hear from the restaurant owners who have transformed their operations with RestoBuddy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

              {/* Story Card 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white/80 dark:bg-white/[0.02] border border-neutral-200/50 dark:border-white/5 p-8 rounded-[2.5rem] shadow-xl shadow-black/5 relative flex flex-col justify-between group hover:-translate-y-1.5 transition-all duration-300"
              >
                <div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center rounded-2xl mb-6 group-hover:scale-110 transition-transform">
                    <Quote className="w-6 h-6 fill-current" />
                  </div>

                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-orange-500 text-orange-500" />
                    ))}
                  </div>

                  <p className="text-lg md:text-xl font-bold text-neutral-800 dark:text-neutral-200 leading-relaxed italic mb-8">
                    "RestoBuddy helped us streamline operations and better engage with our customers."
                  </p>
                </div>

                <div className="flex items-center gap-4 border-t border-neutral-100 dark:border-white/5 pt-6">
                  <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-black text-neutral-700 dark:text-neutral-300 text-lg">
                    RO
                  </div>
                  <div>
                    <h4 className="font-extrabold text-neutral-900 dark:text-white leading-tight">
                      Restaurant Owner
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Verified RestoBuddy Partner
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Story Card 2: Your Success Story Next / Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-orange-50/20 dark:bg-orange-500/[0.01] border-2 border-dashed border-orange-500/30 dark:border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between items-center text-center group hover:border-orange-500/50 transition-colors duration-300 py-12"
              >
                <div className="my-auto space-y-6">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 mx-auto text-3xl animate-bounce">
                    🚀
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                      Your Success Story Next?
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto leading-relaxed">
                      We're collecting launch stories. Launch RestoBuddy today and get featured here.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsDemoModalOpen(true)}
                      className="px-6 py-3 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-500 shadow-md transition-colors"
                    >
                      Book a Free Demo
                    </button>
                  </div>
                </div>


              </motion.div>

            </div>

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
        <section className="py-32 md:py-40 relative overflow-hidden bg-gradient-to-br from-orange-600 to-rose-700">
          {/* Subtle grid pattern or glass layers */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-black mb-8 tracking-tighter leading-tight"
            >
              Ready to Build a More Profitable Restaurant?
            </motion.h2>

            <div className="space-y-4 mb-12 text-lg md:text-xl text-orange-100/90 font-bold max-w-2xl mx-auto leading-relaxed">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                ✓ Stop depending on disconnected tools.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                ✓ Start owning your customers.
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                ✓ Start growing your business with RestoBuddy.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="w-full sm:w-auto px-10 py-5 bg-white text-orange-600 font-black text-lg rounded-2xl hover:scale-105 active:scale-95 transition-transform shadow-2xl shadow-orange-950/40 cursor-pointer"
              >
                Book Your Free Demo Today
              </button>
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
                  <p className="mb-1"><a href="tel:+917002309306" className="hover:text-orange-400 transition-colors">+91 70023 09306</a></p>
                  <p><a href="tel:+918938986630" className="hover:text-orange-400 transition-colors">+91 89389 86630</a></p>
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

      {/* Demo Booking Modal */}
      <AnimatePresence>
        {isDemoModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsDemoModalOpen(false);
                setDemoSubmitted(false);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0e0e0e] border border-neutral-200 dark:border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative elements */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/10 dark:bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => {
                  setIsDemoModalOpen(false);
                  setDemoSubmitted(false);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!demoSubmitted ? (
                <form onSubmit={handleDemoSubmit} className="space-y-6 relative">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                      Book a Free Demo <Sparkles className="w-6 h-6 text-orange-500 animate-pulse" />
                    </h3>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2">
                      Get a personalized walk-through of the RestoBuddy restaurant operating system.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                        Restaurant Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={demoFormData.restaurantName}
                          onChange={(e) => setDemoFormData({ ...demoFormData, restaurantName: e.target.value })}
                          placeholder="e.g. Hasty Tasty Restaurant"
                          className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                        Owner / Manager Name *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                          <User2 className="w-5 h-5" />
                        </div>
                        <input
                          type="text"
                          required
                          value={demoFormData.ownerName}
                          onChange={(e) => setDemoFormData({ ...demoFormData, ownerName: e.target.value })}
                          placeholder="e.g. Abhijit Borgohain"
                          className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                          <PhoneCall className="w-5 h-5" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={demoFormData.phone}
                          onChange={(e) => setDemoFormData({ ...demoFormData, phone: e.target.value })}
                          placeholder="e.g. +91 98765 43210"
                          className="block w-full pl-11 pr-4 py-3.5 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                          Email (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            value={demoFormData.email}
                            onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                            placeholder="owner@example.com"
                            className="block w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
                          City (Optional)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            value={demoFormData.city}
                            onChange={(e) => setDemoFormData({ ...demoFormData, city: e.target.value })}
                            placeholder="e.g. Guwahati"
                            className="block w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-2xl text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingDemo}
                    className="w-full py-4 bg-gradient-to-r from-orange-600 to-rose-600 text-white font-bold text-lg rounded-2xl hover:shadow-xl hover:shadow-orange-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingDemo ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        Confirm Free Booking <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6 relative"
                >
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 stroke-[3]" />
                  </div>
                  <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Booking Confirmed!
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-4 leading-relaxed max-w-sm mx-auto">
                    Thank you, <span className="font-bold text-neutral-900 dark:text-white">{demoFormData.ownerName || 'partner'}</span>. We have received your request for <span className="font-bold text-neutral-900 dark:text-white">{demoFormData.restaurantName}</span>.
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-2">
                    Our team will call you at <span className="font-semibold">{demoFormData.phone}</span> within 2 hours to schedule your personalized live demo.
                  </p>
                  <button
                    onClick={() => {
                      setIsDemoModalOpen(false);
                      setDemoSubmitted(false);
                    }}
                    className="mt-8 px-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Back to Website
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
