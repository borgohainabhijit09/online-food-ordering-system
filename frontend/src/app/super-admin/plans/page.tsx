'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Copy, ToggleLeft, ToggleRight, X, Check, Save } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

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

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    monthlyPrice: 0,
    yearlyPrice: '' as string | number,
    description: '',
    isActive: true,
    featureCodes: [] as string[]
  });

  const getHeaders = () => {
    const token = localStorage.getItem('superAdminToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const [plansRes, featuresRes] = await Promise.all([
        fetch(`/api/plans`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/features`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (plansRes.ok && featuresRes.ok) {
        setPlans(await plansRes.json());
        setFeatures(await featuresRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: Plan, clone = false) => {
    if (plan) {
      setFormData({
        id: clone ? '' : plan.id,
        name: clone ? `${plan.name} (Copy)` : plan.name,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice || '',
        description: plan.description || '',
        isActive: plan.isActive,
        featureCodes: plan.planFeatures.map(pf => pf.feature.code)
      });
    } else {
      setFormData({
        id: '',
        name: '',
        monthlyPrice: 0,
        yearlyPrice: '',
        description: '',
        isActive: true,
        featureCodes: []
      });
    }
    setIsModalOpen(true);
  };

  const handleToggleFeature = (code: string) => {
    setFormData(prev => {
      const codes = prev.featureCodes.includes(code)
        ? prev.featureCodes.filter(c => c !== code)
        : [...prev.featureCodes, code];
      return { ...prev, featureCodes: codes };
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = formData.id 
        ? `/api/plans/${formData.id}`
        : `/api/plans`;
      
      const method = formData.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify({
          name: formData.name,
          monthlyPrice: Number(formData.monthlyPrice),
          yearlyPrice: formData.yearlyPrice ? Number(formData.yearlyPrice) : null,
          description: formData.description,
          isActive: formData.isActive,
          featureCodes: formData.featureCodes
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        await fetchData();
      } else {
        alert('Failed to save plan');
      }
    } catch (e) {
      console.error(e);
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePlanActive = async (plan: Plan) => {
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: plan.name,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          description: plan.description,
          isActive: !plan.isActive,
          featureCodes: plan.planFeatures.map(pf => pf.feature.code)
        })
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-800">Plans & Features</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage subscription tiers and customize feature accessibility.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-black hover:bg-neutral-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      {/* Plans List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plans.map(plan => (
          <div 
            key={plan.id}
            className={`bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow ${
              !plan.isActive ? 'opacity-60 bg-neutral-50' : 'border-neutral-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  plan.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {plan.isActive ? 'Active' : 'Disabled'}
                </span>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleOpenModal(plan)}
                    title="Edit Plan"
                    className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleOpenModal(plan, true)}
                    title="Clone Plan"
                    className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleTogglePlanActive(plan)}
                    title={plan.isActive ? 'Disable Plan' : 'Enable Plan'}
                    className="p-1.5 hover:bg-neutral-100 rounded text-neutral-600 transition-colors"
                  >
                    {plan.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-xl text-neutral-900 mt-3">{plan.name}</h3>
              <p className="text-xs text-neutral-500 mt-1 h-12 leading-relaxed">{plan.description || 'No description provided.'}</p>

              <div className="my-5 border-t border-b border-neutral-100 py-3 flex justify-between items-baseline">
                <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Pricing</span>
                <div className="text-right">
                  <span className="text-xl font-black text-neutral-900">₹{plan.monthlyPrice}</span>
                  <span className="text-[10px] text-neutral-400 font-bold">/mo</span>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Enabled Features ({plan.planFeatures.length})</h4>
                <ul className="space-y-1.5 text-xs text-neutral-700">
                  {plan.planFeatures.map((pf, i) => {
                    const isPayment = pf.feature.code === 'ONLINE_PAYMENTS' || pf.feature.name.toLowerCase().includes('payment');
                    return (
                    <li key={i} className={`flex items-center gap-1.5 font-medium ${isPayment ? 'text-blue-700 dark:text-blue-600 bg-blue-50 py-1 px-2 -ml-2 rounded-lg' : ''}`}>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isPayment ? 'bg-blue-200 text-blue-700' : 'bg-green-100 text-green-600'}`}>✓</div>
                      <span>{pf.feature.name}</span>
                      {isPayment && <span className="ml-auto text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Premium</span>}
                    </li>
                    );
                  })}
                  {plan.planFeatures.length === 0 && (
                    <li className="text-neutral-400 italic text-xs">No features assigned.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">
                {formData.id ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Plan Name</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Starter, Premium"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Monthly Price (₹)</label>
                  <input 
                    required 
                    type="number" 
                    value={formData.monthlyPrice} 
                    onChange={e => setFormData({...formData, monthlyPrice: Number(e.target.value)})}
                    placeholder="499"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Yearly Price (₹ - Optional)</label>
                  <input 
                    type="number" 
                    value={formData.yearlyPrice} 
                    onChange={e => setFormData({...formData, yearlyPrice: e.target.value})}
                    placeholder="4999"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-black text-sm"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 rounded text-black border-neutral-300 focus:ring-black"
                    />
                    <span className="text-sm font-semibold text-neutral-700">Active and available for checkout</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Summary of plan value..."
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-black text-sm resize-none"
                />
              </div>

              {/* Feature checkboxes list */}
              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Select Plan Features</label>
                <div className="grid grid-cols-2 gap-3.5 border border-neutral-100 p-4 rounded-xl max-h-60 overflow-y-auto bg-neutral-50/50">
                  {features.map(f => {
                    const isChecked = formData.featureCodes.includes(f.code);
                    return (
                      <div 
                        key={f.id}
                        onClick={() => handleToggleFeature(f.code)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all ${
                          isChecked 
                            ? 'bg-white border-black ring-1 ring-black' 
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center ${
                          isChecked ? 'bg-black border-black text-white' : 'border-neutral-300'
                        }`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-neutral-900">{f.name}</p>
                          <p className="text-[10px] text-neutral-400 mt-0.5 leading-normal">{f.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 -mx-6 -mb-6 mt-6 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-bold text-neutral-600 hover:text-neutral-950 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-black hover:bg-neutral-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
