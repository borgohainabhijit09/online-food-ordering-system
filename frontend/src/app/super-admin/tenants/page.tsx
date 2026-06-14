'use client';

import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, CheckCircle2, AlertCircle, Clock, Edit2, X } from 'lucide-react';

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editingTenant, setEditingTenant] = useState<any | null>(null);
  const [viewingProfile, setViewingProfile] = useState<any | null>(null);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editPackageId, setEditPackageId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      
      const [tenantsRes, packagesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/tenants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/packages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (tenantsRes.ok && packagesRes.ok) {
        setTenants(await tenantsRes.json());
        setPackages(await packagesRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tenants.filter(t => t.businessName.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>;
      case 'PAST_DUE': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold uppercase"><AlertCircle className="w-3.5 h-3.5" /> Past Due</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-bold uppercase"><Clock className="w-3.5 h-3.5" /> None</span>;
    }
  };

  const handleImpersonate = async (tenantId: string) => {
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/tenants/${tenantId}/impersonate`, {
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
        alert('Failed to impersonate tenant');
      }
    } catch (err) {
      console.error(err);
      alert('Error during impersonation');
    }
  };

  const openEditModal = (t: any) => {
    setEditingTenant(t);
    setEditIsActive(t.isActive ?? true);
    setEditPackageId(t.subscription?.packageId || '');
  };

  const handleSaveEdit = async () => {
    if (!editingTenant) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('superAdminToken') || localStorage.getItem('adminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/tenants/${editingTenant.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          isActive: editIsActive,
          packageId: editPackageId || undefined
        })
      });
      
      if (res.ok) {
        setEditingTenant(null);
        await fetchData(); // Refresh list
      } else {
        alert('Failed to update tenant');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSaving(false);
    }
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
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search businesses..."
            className="pl-10 pr-4 py-2 bg-white border border-neutral-200 rounded-xl outline-none focus:border-black transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="font-medium p-4">Customer / Business</th>
              <th className="font-medium p-4">Contact Info</th>
              <th className="font-medium p-4">Package</th>
              <th className="font-medium p-4">Billing Status</th>
              <th className="font-medium p-4">Access</th>
              <th className="font-medium p-4 w-48 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-neutral-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-neutral-900">{t.tenantAccess?.[0]?.user?.name || 'Unknown Owner'}</div>
                  <div className="text-sm text-neutral-500">{t.businessName} (/{t.slug})</div>
                </td>
                <td className="p-4">
                  <div className="text-sm text-neutral-700">{t.email}</div>
                  <div className="text-sm text-neutral-500">{t.phone}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-neutral-700">{t.subscription?.package?.name || 'No Subscription'}</div>
                  <div className="text-xs text-neutral-500">
                    {t.subscription?.package?.price ? `₹${t.subscription.package.price}/mo` : ''} 
                    {t.subscription?.nextBillingDate ? ` (Next: ${new Date(t.subscription.nextBillingDate).toLocaleDateString()})` : ''}
                  </div>
                </td>
                <td className="p-4">
                  {getStatusBadge(t.subscription?.status || 'NONE')}
                </td>
                <td className="p-4">
                  {t.isActive === false ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-neutral-200 text-neutral-600">SUSPENDED</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700">ACTIVE</span>
                  )}
                </td>
                <td className="p-4 text-right whitespace-nowrap flex items-center justify-end gap-2">
                  <button 
                    onClick={() => setViewingProfile(t)}
                    className="text-blue-600 bg-blue-50 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs uppercase"
                  >
                    Profile
                  </button>
                  <button 
                    onClick={() => handleImpersonate(t.id)}
                    className="text-orange-600 bg-orange-50 hover:bg-orange-100 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs uppercase"
                  >
                    Login As
                  </button>
                  <button 
                    onClick={() => openEditModal(t)}
                    className="text-neutral-600 bg-neutral-100 hover:bg-neutral-200 font-bold p-1.5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-500">
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
              <h2 className="text-xl font-bold text-neutral-900">Customer Profile</h2>
              <button onClick={() => setViewingProfile(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
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
                  <p className="text-sm text-blue-700">{viewingProfile.subscription?.package?.name || 'No Plan'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-900">Status</p>
                  <p className="text-sm text-blue-700">{viewingProfile.isActive ? 'Active' : 'Suspended'}</p>
                </div>
              </div>
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
                    <option key={p.id} value={p.id}>{p.name} - ₹{p.price}/mo</option>
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
    </div>
  );
}
