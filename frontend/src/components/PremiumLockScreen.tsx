'use client';

import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, Mail, Phone, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface PremiumLockScreenProps {
  featureName: string;
  requiredPlan?: string;
  featureDescription?: string;
}

export default function PremiumLockScreen({ 
  featureName, 
  requiredPlan = 'Premium', 
  featureDescription 
}: PremiumLockScreenProps) {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-gradient-to-br from-neutral-50 to-orange-50/20 dark:from-neutral-900 dark:to-orange-950/10">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 shadow-2xl rounded-3xl p-8 text-center relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6 animate-bounce">
          <Lock className="w-10 h-10 text-white" />
        </div>

        {/* Header */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Premium Module
        </span>
        
        <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-3 tracking-tight">
          Unlock {featureName}
        </h2>
        
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md mx-auto mb-6">
          {featureDescription || `The ${featureName} module is a premium capability that helps you scale your restaurant operations, automate tasks, and grow sales.`}
        </p>

        {/* Plan requirement detail */}
        <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800/50 rounded-2xl p-4 mb-8 text-left flex items-start gap-3 max-w-md mx-auto">
          <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">Required Plan</p>
            <p className="text-sm font-medium text-neutral-950 dark:text-neutral-50">
              Upgrade to the <span className="font-extrabold text-orange-600 dark:text-orange-500">{requiredPlan} Plan</span> to access this and other premium features.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Link 
            href="/admin/upgrade" 
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            Upgrade Plan <ArrowRight className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => setShowContactModal(true)}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-extrabold px-6 py-3.5 rounded-xl transition-all"
          >
            Contact Sales
          </button>
        </div>
      </div>

      {/* Contact Sales Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Talk to RestoBuddy Sales</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Our experts can customize a plan to fit your business, offer volume discounts, or set up a free trial.
            </p>
            
            <div className="space-y-3 mb-6">
              <a 
                href="mailto:sales@restobuddy.com?subject=Subscription%20Upgrade%20Inquiry"
                className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950 rounded-xl flex items-center justify-center text-orange-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white">Email Us</p>
                  <p className="text-xs text-neutral-500">sales@restobuddy.com</p>
                </div>
              </a>

              <a 
                href="tel:+919876543210"
                className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950 rounded-xl flex items-center justify-center text-amber-600">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-neutral-900 dark:text-white">Call Sales Hotline</p>
                  <p className="text-xs text-neutral-500">+91 98765 43210</p>
                </div>
              </a>
            </div>

            <button 
              onClick={() => setShowContactModal(false)}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
