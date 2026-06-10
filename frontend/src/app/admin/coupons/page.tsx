'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    firstOrderOnly: false,
    active: true,
    startDate: '',
    expiryDate: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await apiClient.get('/api/coupons');
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderValue: formData.minOrderValue ? Number(formData.minOrderValue) : null,
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
      };

      if (formData.id) {
        await apiClient.patch(`/api/coupons/${formData.id}`, payload);
      } else {
        // Create new
        const { id, ...createData } = payload;
        await apiClient.post('/api/coupons', createData);
      }

      setShowForm(false);
      resetForm();
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon', error);
      alert('Error saving coupon');
    }
  };

  const handleEdit = (coupon: any) => {
    setFormData({
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue || 0,
      maxDiscount: coupon.maxDiscount || 0,
      firstOrderOnly: coupon.firstOrderOnly,
      active: coupon.active,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      await apiClient.delete(`/api/coupons/${id}`);
      fetchCoupons();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await apiClient.patch(`/api/coupons/${id}`, { active: !currentStatus });
    fetchCoupons();
  };

  const resetForm = () => {
    setFormData({
      id: '',
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      firstOrderOnly: false,
      active: true,
      startDate: '',
      expiryDate: ''
    });
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-800 dark:text-neutral-100">Coupons & Discounts</h1>
          <button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto"
          >
            Create Coupon
          </button>
        </div>

        {showForm && (
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 mb-8">
            <h2 className="text-xl font-bold mb-4">{formData.id ? 'Edit Coupon' : 'New Coupon'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Coupon Code</label>
                  <input required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800 uppercase" placeholder="e.g. SAVE10" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <select value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800">
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value</label>
                  <input required type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Min Order Value (Optional)</label>
                  <input type="number" step="0.01" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800" placeholder="e.g. 1000" />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Discount Amount (Optional)</label>
                    <input type="number" step="0.01" value={formData.maxDiscount} onChange={e => setFormData({...formData, maxDiscount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800" placeholder="e.g. 150" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date (Optional)</label>
                  <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-3 py-2 border rounded dark:bg-neutral-950 dark:border-neutral-800" />
                </div>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.firstOrderOnly} onChange={e => setFormData({...formData, firstOrderOnly: e.target.checked})} className="rounded border-gray-300" />
                  <span>First Order Only</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="rounded border-gray-300" />
                  <span>Active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t dark:border-neutral-800">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save Coupon</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[600px]">
              <thead className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="p-4 font-semibold">Code</th>
                  <th className="p-4 font-semibold">Discount</th>
                  <th className="p-4 font-semibold">Min Order</th>
                  <th className="p-4 font-semibold">Rules</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">No coupons created yet.</td>
                  </tr>
                ) : (
                  coupons.map(coupon => (
                    <tr key={coupon.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{coupon.code}</td>
                      <td className="p-4">
                        {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        {coupon.maxDiscount ? <span className="text-xs text-neutral-500 block">Up to ₹{coupon.maxDiscount}</span> : null}
                      </td>
                      <td className="p-4">{coupon.minOrderValue ? `₹${coupon.minOrderValue}` : 'None'}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {coupon.firstOrderOnly && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded w-max">First Order</span>}
                          {coupon.expiryDate && <span className="text-xs text-neutral-500">Exp: {new Date(coupon.expiryDate).toLocaleDateString()}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleActive(coupon.id, coupon.active)}
                          className={`px-3 py-1 text-sm rounded-full ${coupon.active ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}
                        >
                          {coupon.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleEdit(coupon)} className="text-indigo-600 hover:text-indigo-800 text-sm">Edit</button>
                        <button onClick={() => handleDelete(coupon.id)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
