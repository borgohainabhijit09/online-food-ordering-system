'use client';

import React, { useEffect, useState } from 'react';
import { useSubscription } from '../../../components/SubscriptionContext';
import { ArrowRight, Check, X, ShieldCheck, Sparkles, Loader2, FlaskConical, Clock, CheckCircle2, AlertTriangle, Send, CalendarClock } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

interface TrialInfo {
  trialStatus: 'TESTING' | 'TRIAL_ACTIVE' | 'TRIAL_ENDED' | 'SUBSCRIBED';
  trialStartDate: string | null;
  trialEndDate: string | null;
  trialDays: number;
  signedUpAt: string;
  daysRemaining: number | null;
  extensionRequest: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    daysRequested: number;
    reason: string | null;
    reviewNote: string | null;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  description: string | null;
  planFeatures: Array<{ feature: { code: string; name: string } }>;
}

export default function UpgradePage() {
  const { currentPlan, tenantId, refreshFeatures } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [matrix, setMatrix] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [extensionDays, setExtensionDays] = useState(7);
  const [extensionReason, setExtensionReason] = useState('');
  const [submittingExtension, setSubmittingExtension] = useState(false);

  useEffect(() => {
    fetchCompareData();
    fetchTrialStatus();
  }, []);

  const fetchCompareData = async () => {
    try {
      const res = await apiClient.get('/api/subscription/compare');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        setMatrix(data.matrix || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrialStatus = async () => {
    try {
      const res = await apiClient.get('/api/trial/status');
      if (res.ok) {
        setTrialInfo(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch trial status:', error);
    }
  };

  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingExtension(true);
    try {
      const res = await apiClient.post('/api/trial/request-extension', {
        daysRequested: extensionDays,
        reason: extensionReason,
      });
      if (res.ok) {
        setIsExtensionModalOpen(false);
        setExtensionReason('');
        fetchTrialStatus();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Failed to request extension:', error);
    } finally {
      setSubmittingExtension(false);
    }
  };

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleUpgrade = async (planId: string, planName: string) => {
    if (!tenantId) return;
    setUpgradingPlanId(planId);
    setSuccessMsg('');
    try {
      // 1. Create Order
      const resOrder = await fetch(`/api/subscription/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || sessionStorage.getItem('impersonatedToken') || ''}`
        },
        body: JSON.stringify({ planId, tenantId })
      });

      if (!resOrder.ok) {
        const err = await resOrder.json();
        alert(err.message || 'Failed to create order');
        setUpgradingPlanId(null);
        return;
      }

      const orderData = await resOrder.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'RestoBuddy',
        description: `Upgrade to ${planName} Plan`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // 3. Verify Payment
            const resVerify = await fetch(`/api/subscription/verify-payment`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken') || sessionStorage.getItem('impersonatedToken') || ''}`
              },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
            });

            if (resVerify.ok) {
              setSuccessMsg(`Congratulations! Your restaurant has been successfully upgraded to the ${planName} Plan.`);
              await refreshFeatures(); // Update subscription context
              fetchTrialStatus();
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (error) {
            console.error('Verification error:', error);
            alert('Failed to verify payment.');
          } finally {
            setUpgradingPlanId(null);
          }
        },
        prefill: {
          name: 'Restaurant Admin',
          email: 'admin@restaurant.com'
        },
        theme: {
          color: '#ea580c'
        },
        modal: {
          ondismiss: function () {
            setUpgradingPlanId(null);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(`Payment failed: ${response.error.description}`);
        setUpgradingPlanId(null);
      });
      rzp.open();

    } catch (e) {
      console.error(e);
      alert('Upgrade flow failed due to network error.');
      setUpgradingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-neutral-500 text-xs font-semibold animate-pulse">Loading plan configurations...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Boost Your Operations
        </span>
        <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">Upgrade Your Plan</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xl mx-auto">
          Choose the plan that matches your restaurant's stage of growth. Unlock features dynamically.
        </p>
      </div>

      {/* ── Trial Status Banner ───────────────────────────────── */}
      {trialInfo && trialInfo.trialStatus !== 'SUBSCRIBED' && (() => {
        const statusConfig = {
          TESTING:      { label: 'Testing Phase',  icon: FlaskConical,   bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-200 dark:border-blue-800',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',   iconColor: 'text-blue-500' },
          TRIAL_ACTIVE: { label: 'Trial Active',   icon: Clock,          bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300', iconColor: 'text-orange-500' },
          TRIAL_ENDED:  { label: 'Trial Ended',    icon: AlertTriangle,  bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-200 dark:border-red-800',     badge: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',     iconColor: 'text-red-500' },
          SUBSCRIBED:   { label: 'Subscribed',     icon: CheckCircle2,   bg: '',  border: '', badge: '', iconColor: '' },
        };
        const cfg = statusConfig[trialInfo.trialStatus];
        const Icon = cfg.icon;
        const hasPendingReq = trialInfo.extensionRequest?.status === 'PENDING';
        const canRequest = ['TRIAL_ACTIVE', 'TRIAL_ENDED'].includes(trialInfo.trialStatus) && !hasPendingReq;

        return (
          <div className={`rounded-3xl border p-6 ${cfg.bg} ${cfg.border}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 ${cfg.iconColor}`}><Icon className="w-8 h-8" /></div>
                <div>
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    {trialInfo.daysRemaining !== null && (
                      <span className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                        {trialInfo.daysRemaining === 0 ? 'Expires today' : `${trialInfo.daysRemaining} days remaining`}
                      </span>
                    )}
                  </div>
                  <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                    {trialInfo.trialStatus === 'TESTING' && 'Your account is in the testing phase. Your trial will be activated by our team shortly.'}
                    {trialInfo.trialStatus === 'TRIAL_ACTIVE' && `Your ${trialInfo.trialDays}-day trial is running. Enjoy full access to all features.`}
                    {trialInfo.trialStatus === 'TRIAL_ENDED' && 'Your trial has ended. Please subscribe to continue using the platform.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-5 text-sm text-neutral-600 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5"><CalendarClock className="w-4 h-4" /> Signed up: {new Date(trialInfo.signedUpAt).toLocaleDateString()}</span>
                    {trialInfo.trialStartDate && <span>Trial started: {new Date(trialInfo.trialStartDate).toLocaleDateString()}</span>}
                    {trialInfo.trialEndDate && <span>Trial ends: {new Date(trialInfo.trialEndDate).toLocaleDateString()}</span>}
                  </div>
                  {/* Extension request status */}
                  {trialInfo.extensionRequest && (
                    <div className={`mt-4 text-sm font-semibold px-4 py-2 rounded-xl inline-flex items-center gap-2 ${
                      trialInfo.extensionRequest.status === 'PENDING'  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      trialInfo.extensionRequest.status === 'APPROVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {trialInfo.extensionRequest.status === 'PENDING'  && '⏳ Extension request pending review'}
                      {trialInfo.extensionRequest.status === 'APPROVED' && `✅ Extension of ${trialInfo.extensionRequest.daysRequested} days approved`}
                      {trialInfo.extensionRequest.status === 'REJECTED' && `❌ Extension request rejected${trialInfo.extensionRequest.reviewNote ? `: ${trialInfo.extensionRequest.reviewNote}` : ''}`}
                    </div>
                  )}
                </div>
              </div>
              {canRequest && (
                <button
                  onClick={() => setIsExtensionModalOpen(true)}
                  className="shrink-0 inline-flex items-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" /> Request Extension
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Extension Request Modal */}
      {isExtensionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-neutral-200 dark:border-neutral-800">
            <button onClick={() => setIsExtensionModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"><X className="w-5 h-5" /></button>
            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-1">Request Trial Extension</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">Let us know how many more days you need and why. Our team will review your request.</p>
            <form onSubmit={handleRequestExtension} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-1.5">Additional Days (1–30)</label>
                <input type="number" min={1} max={30} required value={extensionDays}
                  onChange={e => setExtensionDays(Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wide mb-1.5">Reason (Optional)</label>
                <textarea rows={3} value={extensionReason} onChange={e => setExtensionReason(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="e.g. We need more time to train our staff..." />
              </div>
              <button type="submit" disabled={submittingExtension}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl transition-all disabled:opacity-50">
                {submittingExtension ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Feature Highlight Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-900/20">
        <div className="space-y-3 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-200 text-xs font-bold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Breakthrough Feature
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Zero-Commission Online Payments</h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
            Stop losing 20-30% to delivery aggregators. Connect your own Razorpay account and let your customers pay directly via UPI, Credit Cards, NetBanking, and Wallets. The money goes straight to your bank account — we take 0% commission.
          </p>
        </div>
        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
            <Check className="w-4 h-4" /> Available on Growth Plan & Above
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 text-emerald-800 dark:text-emerald-400 text-sm font-bold flex items-center gap-3 animate-fade-in">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {plans.map(p => {
          const isCurrent = currentPlan?.id === p.id;
          const isEnterprise = p.name === 'Enterprise';
          return (
            <div 
              key={p.id}
              className={`bg-white dark:bg-neutral-950 border rounded-3xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-md ${
                isCurrent 
                  ? 'border-orange-500 dark:border-orange-500 ring-1 ring-orange-500' 
                  : 'border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {/* Highlight current plan tag */}
              {isCurrent && (
                <div className="absolute top-0 right-0 bg-orange-500 text-white px-3 py-1 rounded-bl-xl text-[10px] font-extrabold uppercase tracking-wide">
                  Active
                </div>
              )}

              <div>
                <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white">{p.name}</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 h-12 leading-relaxed">
                  {p.description}
                </p>

                <div className="my-6">
                  {isEnterprise ? (
                    <span className="text-3xl font-extrabold text-neutral-950 dark:text-white">Custom</span>
                  ) : (
                    <div className="flex items-baseline">
                      <span className="text-3xl font-extrabold text-neutral-950 dark:text-white">₹{p.monthlyPrice}</span>
                      <span className="text-xs text-neutral-400 font-semibold ml-1">/mo</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                {isCurrent ? (
                  <button 
                    disabled 
                    className="w-full bg-neutral-100 dark:bg-neutral-900 text-neutral-400 font-extrabold py-3 rounded-xl text-xs cursor-default"
                  >
                    Current Plan
                  </button>
                ) : isEnterprise ? (
                  <a 
                    href="mailto:sales@restobuddy.com?subject=Enterprise%20Plan%20Inquiry"
                    className="w-full inline-flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-extrabold py-3 rounded-xl text-xs transition-colors"
                  >
                    Contact Sales
                  </a>
                ) : (
                  <button 
                    onClick={() => handleUpgrade(p.id, p.name)}
                    disabled={upgradingPlanId !== null}
                    className="w-full inline-flex items-center justify-center gap-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold py-3 rounded-xl text-xs transition-all disabled:opacity-50 shadow-sm shadow-orange-500/10"
                  >
                    {upgradingPlanId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Select Plan <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Comparison Matrix */}
      <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
          <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg">Compare Features</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Detailed list of inclusions per subscription tier.</p>
        </div>
        
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Feature</th>
              {plans.map(p => (
                <th key={p.id} className="px-6 py-4 text-center">{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-850">
            {matrix.map((row, idx) => {
              const isPaymentFeat = row.featureName?.toLowerCase().includes('payment');
              return (
              <tr key={idx} className={`transition-colors ${isPaymentFeat ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-900/10'}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold block ${isPaymentFeat ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-900 dark:text-white'}`}>
                      {row.featureName}
                    </span>
                    {isPaymentFeat && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-[9px] font-extrabold uppercase tracking-widest">Premium</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium block mt-0.5 ${isPaymentFeat ? 'text-blue-600/70 dark:text-blue-400/70' : 'text-neutral-400'}`}>
                    {row.description}
                  </span>
                </td>
                {plans.map(p => {
                  const hasFeat = row[p.name];
                  return (
                    <td key={p.id} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        {hasFeat ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-500">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600 dark:text-red-500">
                            <X className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
