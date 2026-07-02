'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Search, MoreVertical, CheckCircle2, AlertCircle, Clock, Edit2, X, Shield, Trash2, FlaskConical, Play, Bell } from 'lucide-react';
import SecurityTab from './SecurityTab';

export default function SuperAdminTenants() {
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, message: string, onConfirm: () => void}>({isOpen: false, message: '', onConfirm: () => {}});
  const confirmAction = (message: string, onConfirm: () => void) => {
    setConfirmState({ isOpen: true, message, onConfirm });
  };
  const [tenants, setTenants] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [idSearch, setIdSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');

  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'security'>('overview');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPackageId, setEditPackageId] = useState('');
  const [saving, setSaving] = useState(false);
  const [trialFilter, setTrialFilter] = useState('ALL');
  const [startingTrialId, setStartingTrialId] = useState<string | null>(null);
  const [trialDaysInput, setTrialDaysInput] = useState<Record<string, number>>({});
  const [extensionRequests, setExtensionRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');

      const [tenantsRes, packagesRes, featuresRes, extensionRes] = await Promise.all([
        fetch(`/api/super-admin/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/super-admin/packages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/features`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/super-admin/trial-extension-requests?status=PENDING`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (tenantsRes.ok && packagesRes.ok && featuresRes.ok) {
        setTenants(await tenantsRes.json());
        setPackages(await packagesRes.json());
        setFeatures(await featuresRes.json());
      }
      if (extensionRes.ok) setExtensionRequests(await extensionRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tenants
    .filter(t => t.businessName.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()))
    .filter(t => idSearch ? (t.restaurantId && t.restaurantId.toLowerCase().includes(idSearch.toLowerCase())) : true)
    .filter(t => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'ACTIVE') return t.isActive === true;
      if (statusFilter === 'SUSPENDED') return t.isActive === false;
      return true;
    })
    .filter(t => {
      if (packageFilter === 'ALL') return true;
      if (packageFilter === 'NONE') return !t.currentPlanId;
      return t.currentPlanId === packageFilter;
    })
    .filter(t => {
      if (billingFilter === 'ALL') return true;
      if (billingFilter === 'NONE') return !t.currentPlanId;
      return t.currentPlanId !== null;
    })
    .filter(t => {
      if (trialFilter === 'ALL') return true;
      return t.trialStatus === trialFilter;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
      case 'PAST_DUE': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase"><AlertCircle className="w-3.5 h-3.5" /> Past Due</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold uppercase"><Clock className="w-3.5 h-3.5" /> None</span>;
    }
  };

  const getTrialBadge = (t: any) => {
    const daysLeft = t.trialEndDate ? Math.max(0, Math.ceil((new Date(t.trialEndDate).getTime() - Date.now()) / 86400000)) : null;
    switch (t.trialStatus) {
      case 'TESTING': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase"><FlaskConical className="w-3 h-3" /> Testing</span>;
      case 'TRIAL_ACTIVE': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold uppercase"><Clock className="w-3 h-3" /> Trial ({daysLeft}d left)</span>;
      case 'TRIAL_ENDED': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase"><AlertCircle className="w-3 h-3" /> Ended</span>;
      case 'SUBSCRIBED': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase"><CheckCircle2 className="w-3 h-3" /> Subscribed</span>;
      default: return null;
    }
  };

  const handleStartTrial = async (tenantId: string, days: number) => {
    setStartingTrialId(tenantId);
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/start-trial`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialDays: days })
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to start trial');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setStartingTrialId(null);
    }
  };

  const [movingToPaidId, setMovingToPaidId] = useState<string | null>(null);

  const handleMoveToPaid = async (tenantId: string) => {
    confirmAction('Are you sure you want to end this trial and generate a pending invoice?', async () => {
    setMovingToPaidId(tenantId);
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/move-to-paid`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        await fetchData();
        toast.success('Successfully generated invoice and moved to paid phase.');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Failed to move to paid phase');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setMovingToPaidId(null);
    }
  });
  };

  const handleExtensionDecision = async (requestId: string, status: 'APPROVED' | 'REJECTED', reviewNote?: string) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/trial-extension-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNote })
      });
      if (res.ok) await fetchData();
      else toast.error('Failed to update request');
    } catch (err) {
      toast.error('Network error');
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Open admin panel with impersonation token in URL
        window.open('/admin?impersonate=' + data.token, '_blank');
      } else {
        toast.error('Failed to impersonate tenant');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error during impersonation');
    }
  };

  const openEditModal = (t: any) => {
    setEditingTenant(t);
    setEditIsActive(t.isActive ?? true);
    setEditPackageId(t.currentPlanId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTenant) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('superAdminToken');
      const res = await fetch(`/api/super-admin/tenants/${editingTenant.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: editIsActive,
          currentPlanId: editPackageId || null
        })
      });

      if (res.ok) {
        setEditingTenant(null);
        await fetchData(); // Refresh list
      } else {
        toast.error('Failed to update tenant');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTenant = async (tenantId: string, businessName: string) => {
    confirmAction(`Are you absolutely sure you want to permanently delete the restaurant "${businessName}"? This action CANNOT be undone and will erase all their menus, orders, and data.`, async () => {
      try {
        const token = localStorage.getItem('superAdminToken');
        const res = await fetch(`/api/super-admin/tenants/${tenantId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          toast.success('Restaurant deleted successfully');
          await fetchData(); // Refresh list
        } else {
          const err = await res.json();
          toast.error(`Failed to delete: ${err.message}`);
        }
      } catch (err) {
        console.error(err);
        toast.error('Network error while deleting');
      }
    });
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-neutral-700 text-3xl font-bold mb-2">Registered Businesses</h1>
          <p className="text-neutral-500">Manage tenants and their subscription status.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <select
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Accounts</option>
              <option value="ACTIVE">Active Access</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
            <select
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors text-sm"
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
            >
              <option value="ALL">All Packages</option>
              <option value="NONE">No Package</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors text-sm"
              value={billingFilter}
              onChange={(e) => setBillingFilter(e.target.value)}
            >
              <option value="ALL">All Billing</option>
              <option value="ACTIVE">Active Billing</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="NONE">No Billing</option>
            </select>
            <select
              className="px-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors text-sm"
              value={trialFilter}
              onChange={(e) => setTrialFilter(e.target.value)}
            >
              <option value="ALL">All Trial Phases</option>
              <option value="TESTING">Testing</option>
              <option value="TRIAL_ACTIVE">Trial Active</option>
              <option value="TRIAL_ENDED">Trial Ended</option>
              <option value="SUBSCRIBED">Subscribed</option>
            </select>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search businesses..."
                className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors text-sm w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search by ID..."
                className="pl-9 pr-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors text-sm w-40"
                value={idSearch}
                onChange={(e) => setIdSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Pending Extension Requests ─────────────────────────── */}
      {extensionRequests.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-0">
          <h2 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" /> {extensionRequests.length} Pending Trial Extension Request{extensionRequests.length > 1 ? 's' : ''}
          </h2>
          <div className="space-y-2">
            {extensionRequests.map((req: any) => (
              <div key={req.id} className="bg-white border border-amber-100 rounded-lg px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-bold text-sm text-neutral-900">{req.tenant?.businessName}</div>
                  <div className="text-xs text-neutral-500">Requesting <strong>{req.daysRequested} extra days</strong>{req.reason ? ` — "${req.reason}"` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExtensionDecision(req.id, 'APPROVED')}
                    className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                  >✓ Approve</button>
                  <button
                    onClick={() => {
                      const note = window.prompt(`Rejection note for ${req.tenant?.businessName} (optional):`);
                      if (note !== null) handleExtensionDecision(req.id, 'REJECTED', note);
                    }}
                    className="text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors"
                  >✗ Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider">
            <tr>
              <th className="font-semibold px-4 py-3">Customer / Business</th>
              <th className="font-semibold px-4 py-3">Package</th>
              <th className="font-semibold px-4 py-3">Trial Phase</th>
              <th className="font-semibold px-4 py-3">Billing Status</th>
              <th className="font-semibold px-4 py-3">Access</th>
              <th className="font-semibold px-4 py-3 w-48 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-2">
                  <div className="font-bold text-neutral-900 text-sm">{t.businessName}</div>
                  <div className="text-neutral-500">Owner: {t.tenantAccess?.[0]?.user?.name || 'Unknown Owner'} <span className="ml-1 px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-400">{t.restaurantId || 'No ID'}</span> (/{t.slug})</div>
                  {t.phone && <div className="text-xs text-neutral-400 mt-0.5">Phone: {t.phone}</div>}
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-neutral-700">{t.currentPlan?.name || 'No Plan'}</div>
                  <div className="text-neutral-500">
                    {t.currentPlan?.monthlyPrice ? `₹${t.currentPlan.monthlyPrice}/mo` : ''}
                  </div>
                  {t.trialStatus === 'SUBSCRIBED' && t.trialEndDate && (
                    <div className="text-[10px] text-neutral-400 mt-1">
                      Cycle: {new Date(t.trialStartDate || t.trialEndDate).toLocaleDateString()} - {new Date(new Date(t.trialStartDate || t.trialEndDate).setMonth(new Date(t.trialStartDate || t.trialEndDate).getMonth() + 1)).toLocaleDateString()}
                    </div>
                  )}
                </td>
                {/* Trial Phase column */}
                <td className="px-4 py-2">
                  <div className="mb-1">{getTrialBadge(t)}</div>
                  {t.trialStatus === 'TESTING' && (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number" min={1} max={60}
                        value={trialDaysInput[t.id] ?? 14}
                        onChange={e => setTrialDaysInput(prev => ({ ...prev, [t.id]: Number(e.target.value) }))}
                        className="w-14 text-xs border border-neutral-200 rounded px-1.5 py-0.5 outline-none"
                      />
                      <span className="text-[10px] text-neutral-400">days</span>
                      <button
                        onClick={() => handleStartTrial(t.id, trialDaysInput[t.id] ?? 14)}
                        disabled={startingTrialId === t.id}
                        className="text-[10px] font-bold bg-orange-500 hover:bg-orange-600 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5 disabled:opacity-50"
                      >
                        {startingTrialId === t.id ? '...' : <><Play className="w-2.5 h-2.5" /> Start</>}
                      </button>
                    </div>
                  )}
                  {t.trialEndDate && t.trialStatus !== 'TESTING' && (
                    <div className="text-[10px] text-neutral-400 mt-0.5">Ends: {new Date(t.trialEndDate).toLocaleDateString()}</div>
                  )}
                  {t.trialStatus !== 'SUBSCRIBED' && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleMoveToPaid(t.id)}
                        disabled={movingToPaidId === t.id}
                        className="text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      >
                        {movingToPaidId === t.id ? 'Processing...' : 'Move to Paid Phase'}
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">
                  {t.isActive ? getStatusBadge('ACTIVE') : getStatusBadge('NONE')}
                </td>
                <td className="px-4 py-2">
                  {t.isActive === false ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-600">SUSPENDED</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">ACTIVE</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setViewingProfile(t);
                      setProfileTab('overview');
                    }}
                    className="text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold px-2 py-1 rounded transition-colors text-[10px] uppercase"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => handleImpersonate(t.id)}
                    className="text-orange-600 bg-orange-50 hover:bg-orange-100 font-bold px-2 py-1 rounded transition-colors text-[10px] uppercase"
                  >
                    Login As
                  </button>
                  <button
                    onClick={() => openEditModal(t)}
                    title="Edit"
                    className="text-neutral-600 bg-neutral-100 hover:bg-neutral-200 font-bold p-1 rounded transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(t.id, t.businessName)}
                    title="Delete"
                    className="text-red-600 bg-red-50 hover:bg-red-100 font-bold p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-500 text-sm">
                  No businesses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {viewingProfile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <h2 className="text-xl font-bold text-neutral-900">Customer Profile</h2>
                <div className="flex gap-4 border-l border-neutral-200 pl-6">
                  <button
                    onClick={() => setProfileTab('overview')}
                    className={`text-sm font-bold transition-colors ${profileTab === 'overview' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'}`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setProfileTab('security')}
                    className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${profileTab === 'security' ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'}`}
                  >
                    <Shield className="w-4 h-4" /> Security
                  </button>
                </div>
              </div>
              <button onClick={() => setViewingProfile(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {profileTab === 'overview' ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                      {viewingProfile.tenantAccess?.[0]?.user?.name?.charAt(0) || viewingProfile.businessName?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900">{viewingProfile.tenantAccess?.[0]?.user?.name || 'Unknown Owner'}</h3>
                      <p className="text-neutral-500">Joined {new Date(viewingProfile.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Contact Email</p>
                      <p className="text-neutral-900 font-medium truncate">{viewingProfile.email}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Phone Number</p>
                      <p className="text-neutral-900 font-medium truncate">{viewingProfile.phone || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Business Name</p>
                      <p className="text-neutral-900 font-medium truncate">{viewingProfile.businessName}</p>
                    </div>
                    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <p className="text-xs text-neutral-500 font-bold uppercase mb-1">Store URL</p>
                      <p className="text-neutral-900 font-medium truncate">/{viewingProfile.slug}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-blue-900">Current Plan</p>
                      <p className="text-sm text-blue-700">{viewingProfile.currentPlan?.name || 'No Plan'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">Status</p>
                      <p className="text-sm text-blue-700">{viewingProfile.isActive ? 'Active' : 'Suspended'}</p>
                    </div>
                  </div>

                  <div className="border-t border-neutral-100 pt-4 mt-4 space-y-4">
                    <h4 className="font-bold text-sm text-neutral-800">Feature Overrides</h4>

                    <div className="space-y-2">
                      {viewingProfile.featureOverrides?.map((ov: any) => (
                        <div key={ov.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100 text-xs">
                          <div>
                            <span className="font-bold text-neutral-900">{ov.feature?.name || ov.featureId}</span>
                            <span className={`ml-2 px-1.5 py-0.5 rounded font-extrabold ${ov.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {ov.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                            {ov.expiresAt && (
                              <p className="text-[10px] text-neutral-400 mt-1">Expires: {new Date(ov.expiresAt).toLocaleDateString()}</p>
                            )}
                            {ov.notes && <p className="text-[10px] italic text-neutral-500 mt-0.5">Notes: {ov.notes}</p>}
                          </div>
                          <button
                            onClick={async () => {
                              confirmAction('Delete override?', async () => {
                                const token = localStorage.getItem('superAdminToken');
                                const res = await fetch(`/api/feature-overrides/${ov.id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  await fetchData();
                                  setViewingProfile(null);
                                }
                              });
                            }}
                            className="text-red-500 font-bold hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {(!viewingProfile.featureOverrides || viewingProfile.featureOverrides.length === 0) && (
                        <p className="text-xs text-neutral-400 italic">No overrides currently active.</p>
                      )}
                    </div>

                    <div className="bg-neutral-50/50 p-4 border border-neutral-200/50 rounded-2xl space-y-3">
                      <p className="font-bold text-xs text-neutral-700">Add Feature Override</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <select id="ovFeatureSelect" className="bg-white border rounded p-2 outline-none">
                          <option value="">Select Feature...</option>
                          {features.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <select id="ovEnabledSelect" className="bg-white border rounded p-2 outline-none">
                          <option value="true">Enable</option>
                          <option value="false">Disable</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <input id="ovExpiresInput" type="date" className="bg-white border rounded p-2 outline-none" title="Expiration Date" />
                        <input id="ovNotesInput" type="text" placeholder="Notes (e.g. Trial)" className="bg-white border rounded p-2 outline-none" />
                      </div>

                      <button
                        onClick={async () => {
                          const featureId = (document.getElementById('ovFeatureSelect') as HTMLSelectElement).value;
                          const enabled = (document.getElementById('ovEnabledSelect') as HTMLSelectElement).value === 'true';
                          const expiresAtVal = (document.getElementById('ovExpiresInput') as HTMLInputElement).value;
                          const notes = (document.getElementById('ovNotesInput') as HTMLInputElement).value;

                          if (!featureId) {
                            toast.error('Please select a feature.');
                            return;
                          }

                          const token = localStorage.getItem('superAdminToken');
                          const res = await fetch(`/api/feature-overrides`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              restaurantId: viewingProfile.id,
                              featureId,
                              enabled,
                              expiresAt: expiresAtVal || null,
                              notes
                            })
                          });

                          if (res.ok) {
                            await fetchData();
                            setViewingProfile(null);
                          } else {
                            toast.error('Failed to save override');
                          }
                        }}
                        className="w-full bg-black hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                      >
                        Add Override
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <SecurityTab tenant={viewingProfile} />
              )}
            </div>

            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end">
              <button
                onClick={() => setViewingProfile(null)}
                className="px-6 py-2 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTenant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900">Edit Tenant</h2>
              <button onClick={() => setEditingTenant(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Subscription Package</label>
                <select
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 outline-none focus:border-black"
                  value={editPackageId}
                  onChange={(e) => setEditPackageId(e.target.value)}
                >
                  <option value="" disabled>Select a package</option>
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - ₹{p.monthlyPrice}/mo</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">Account Access</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive === true}
                      onChange={() => setEditIsActive(true)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="font-medium text-green-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={editIsActive === false}
                      onChange={() => setEditIsActive(false)}
                      className="w-4 h-4 text-orange-600"
                    />
                    <span className="font-medium text-red-600">Suspended (Lockout)</span>
                  </label>
                </div>
                <p className="text-xs text-neutral-500 mt-2">
                  Suspending an account will immediately block access to their public storefront and admin dashboard.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingTenant(null)}
                className="px-4 py-2 font-bold text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-6 py-2 bg-black text-white font-bold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmState.isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Confirm Action</h3>
              <p className="text-neutral-500 text-sm mb-6">{confirmState.message}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmState({ ...confirmState, isOpen: false })} className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">Cancel</button>
                <button onClick={() => { setConfirmState({ ...confirmState, isOpen: false }); confirmState.onConfirm(); }} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

