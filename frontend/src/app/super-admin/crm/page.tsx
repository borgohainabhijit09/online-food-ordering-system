'use client';

import React, { useEffect, useState } from 'react';
import { Contact, Plus, Phone, Mail, Calendar, MoreVertical, X } from 'lucide-react';

interface Lead {
  id: string;
  restaurantName: string;
  ownerName: string;
  phone: string;
  email: string | null;
  city: string | null;
  source: string | null;
  assignedTo: string | null;
  status: string;
  notes: string | null;
  nextFollowUpDate: string | null;
  createdAt: string;
}

const COLUMNS = [
  { id: 'NEW', title: 'New Leads', color: 'border-blue-200 bg-blue-50' },
  { id: 'CONTACTED', title: 'Contacted', color: 'border-yellow-200 bg-yellow-50' },
  { id: 'DEMO_SCHEDULED', title: 'Demo Scheduled', color: 'border-purple-200 bg-purple-50' },
  { id: 'DEMO_COMPLETED', title: 'Demo Completed', color: 'border-indigo-200 bg-indigo-50' },
  { id: 'TRIAL_STARTED', title: 'Trial Started', color: 'border-orange-200 bg-orange-50' },
  { id: 'PAID_CUSTOMER', title: 'Paid', color: 'border-emerald-200 bg-emerald-50' },
  { id: 'LOST', title: 'Lost', color: 'border-red-200 bg-red-50' }
];

export default function CRMDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({ status: 'NEW' });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLeads(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    
    // Optimistic update
    setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      fetchLeads(); // revert on error
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/super-admin/leads`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ status: 'NEW' });
        fetchLeads();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Contact className="w-8 h-8 text-indigo-500" />
            Lead CRM Pipeline
          </h1>
          <p className="text-neutral-500">Track and convert incoming restaurant leads.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-black text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors"
        >
          <Plus className="w-5 h-5" /> Add Lead
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 flex-1 items-start">
        {COLUMNS.map(col => {
          const colLeads = leads.filter(l => l.status === col.id);
          return (
            <div 
              key={col.id} 
              className={`shrink-0 w-80 rounded-2xl border-2 ${col.color} p-4 flex flex-col max-h-full overflow-hidden`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="flex items-center justify-between mb-4 font-bold text-neutral-800 shrink-0">
                {col.title}
                <span className="bg-white/50 text-neutral-600 px-2.5 py-0.5 rounded-full text-sm">
                  {colLeads.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colLeads.map(lead => (
                  <div 
                    key={lead.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 cursor-grab active:cursor-grabbing hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <h3 className="font-bold text-neutral-900 mb-1">{lead.restaurantName}</h3>
                    <div className="text-sm text-neutral-600 mb-3">{lead.ownerName}</div>
                    
                    <div className="space-y-2 text-xs text-neutral-500">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" /> {lead.phone}
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{lead.email}</span>
                        </div>
                      )}
                      {lead.nextFollowUpDate && (
                        <div className="flex items-center gap-2 text-orange-600 font-medium">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div className="border-2 border-dashed border-neutral-300 rounded-xl p-4 text-center text-sm text-neutral-500">
                    Drop leads here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-neutral-100">
              <h2 className="text-xl font-bold">Add New Lead</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Restaurant Name</label>
                <input required type="text" className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black outline-none text-neutral-900" value={formData.restaurantName || ''} onChange={e => setFormData({...formData, restaurantName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Owner Name</label>
                  <input required type="text" className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black outline-none text-neutral-900" value={formData.ownerName || ''} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Phone Number</label>
                  <input required type="tel" className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black outline-none text-neutral-900" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                  <input type="email" className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black outline-none text-neutral-900" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">City</label>
                  <input type="text" className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black outline-none text-neutral-900" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Notes</label>
                <textarea className="w-full border border-neutral-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-black outline-none h-24 resize-none text-neutral-900" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-black text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
