'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, X, Check, Shield } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface StaffRole {
  id: string;
  name: string;
  permissions: string[];
}

interface StaffMember {
  id: string;
  accessId: string;
  name: string;
  phone: string;
  createdAt: string;
  lastLoginAt?: string;
  staffRole?: StaffRole;
  status: string;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard.view', label: 'View Dashboard' },
  { id: 'orders.view', label: 'View Orders' },
  { id: 'orders.manage', label: 'Manage Orders' },
  { id: 'kitchen.view', label: 'Kitchen Screen' },
  { id: 'menu.manage', label: 'Manage Menu & Categories' },
  { id: 'inventory.manage', label: 'Manage Inventory' },
  { id: 'customers.manage', label: 'Manage Customers' },
  { id: 'reports.view', label: 'View Reports & BI' },
  { id: 'settings.manage', label: 'Manage Settings' }
];

export default function StaffManagementPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'roles'>('staff');
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Forms
  const [editingStaffId, setEditingStaffId] = useState('');
  const [staffForm, setStaffForm] = useState({ name: '', phone: '', password: '', staffRoleId: '', status: 'ACTIVE' });
  
  const [editingRoleId, setEditingRoleId] = useState('');
  const [roleForm, setRoleForm] = useState({ name: '', permissions: [] as string[] });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        apiClient.get(`/api/staff${statusFilter ? `?status=${statusFilter}` : ''}`),
        apiClient.get('/api/staff/roles')
      ]);

      if (staffRes.ok) setStaff(await staffRes.json());
      if (rolesRes.ok) setRoles(await rolesRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Roles Handlers ---
  const handleSaveRole = async () => {
    if (!roleForm.name.trim()) return alert('Role name is required');
    try {
      if (editingRoleId) {
        await apiClient.put(`/api/staff/roles/${editingRoleId}`, roleForm);
      } else {
        await apiClient.post('/api/staff/roles', roleForm);
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to save role');
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      const res = await apiClient.delete(`/api/staff/roles/${id}`);
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to delete role');
      } else {
        fetchData();
      }
    } catch (e) {
      alert('Failed to delete role');
    }
  };

  const togglePermission = (permId: string) => {
    setRoleForm(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  // --- Staff Handlers ---
  const handleSaveStaff = async () => {
    if (!staffForm.name || !staffForm.phone || (!editingStaffId && !staffForm.password) || !staffForm.staffRoleId) {
      return alert('Please fill in all required fields');
    }
    
    try {
      if (editingStaffId) {
        await apiClient.put(`/api/staff/${editingStaffId}`, staffForm);
      } else {
        await apiClient.post('/api/staff', staffForm);
      }
      setIsStaffModalOpen(false);
      fetchData();
    } catch (e) {
      alert('Failed to save staff member');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await apiClient.delete(`/api/staff/${id}`);
      fetchData();
    } catch (e) {
      alert('Failed to delete staff member');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
        <div className="space-x-2">
          {activeTab === 'staff' ? (
            <button
              onClick={() => {
                setEditingStaffId('');
                setStaffForm({ name: '', phone: '', password: '', staffRoleId: roles[0]?.id || '', status: 'ACTIVE' });
                setIsStaffModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Add Staff
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRoleId('');
                setRoleForm({ name: '', permissions: [] });
                setIsRoleModalOpen(true);
              }}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" /> Create Role
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 font-medium text-sm ${activeTab === 'staff' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff Members
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm ${activeTab === 'roles' ? 'border-b-2 border-orange-600 text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('roles')}
        >
          Roles & Permissions
        </button>
      </div>

      {activeTab === 'staff' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No staff members found.</td>
                </tr>
              ) : staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-4">{s.phone}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {s.staffRole?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      s.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      s.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        setEditingStaffId(s.accessId);
                        setStaffForm({ name: s.name, phone: s.phone, password: '', staffRoleId: s.staffRole?.id || '', status: s.status || 'ACTIVE' });
                        setIsStaffModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(s.accessId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((r) => (
            <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-bold text-gray-900">{r.name}</h3>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => {
                    setEditingRoleId(r.id);
                    setRoleForm({ name: r.name, permissions: r.permissions });
                    setIsRoleModalOpen(true);
                  }} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteRole(r.id)} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Permissions</h4>
                <ul className="space-y-2">
                  {r.permissions.map(p => {
                    const perm = AVAILABLE_PERMISSIONS.find(ap => ap.id === p);
                    return (
                      <li key={p} className="flex items-center text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 mr-2" />
                        {perm?.label || p}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingStaffId ? 'Edit Staff' : 'Add Staff'}</h2>
              <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={staffForm.staffRoleId}
                  onChange={(e) => setStaffForm({...staffForm, staffRoleId: e.target.value})}
                >
                  <option value="">Select a role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={staffForm.status}
                  onChange={(e) => setStaffForm({...staffForm, status: e.target.value})}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editingStaffId && '(Leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                />
              </div>
              <button
                onClick={handleSaveStaff}
                className="w-full py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 mt-4"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editingRoleId ? 'Edit Role' : 'Create Role'}</h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name (e.g. Manager, Cashier)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Permissions</h3>
                <div className="space-y-3">
                  {AVAILABLE_PERMISSIONS.map(p => (
                    <label key={p.id} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={roleForm.permissions.includes(p.id)}
                        onChange={() => togglePermission(p.id)}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-900">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleSaveRole}
                className="w-full py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
