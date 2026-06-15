'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, Search, Filter } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  tenant: {
    id: string;
    businessName: string;
    email: string;
  };
  _count: {
    messages: number;
  };
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const url = statusFilter ? `/api/super-admin/support/tickets?status=${statusFilter}` : '/api/super-admin/support/tickets';
      const res = await apiClient.get(url);
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-700';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-700';
      case 'RESOLVED': return 'bg-emerald-100 text-emerald-700';
      case 'CLOSED': return 'bg-neutral-100 text-neutral-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-blue-600';
      case 'LOW': return 'text-neutral-500';
      default: return 'text-neutral-500';
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.tenant?.businessName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-neutral-500 mt-1">Manage and resolve customer issues across all tenants.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by subject or business name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-neutral-400" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black w-full sm:w-auto text-black"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">No Tickets Found</h3>
            <p className="text-neutral-500">There are no tickets matching your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Ticket ID</th>
                  <th className="px-6 py-4 font-semibold">Tenant</th>
                  <th className="px-6 py-4 font-semibold">Subject</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Days Opened</th>
                  <th className="px-6 py-4 font-semibold text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredTickets.map(ticket => {
                  const daysOpened = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                  return (
                  <tr key={ticket.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded text-neutral-600">
                        #{ticket.id.split('-')[0]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{ticket.tenant?.businessName || 'Unknown Business'}</div>
                      <div className="text-xs text-neutral-500">{ticket.tenant?.email || 'No email provided'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/super-admin/support/${ticket.id}`} className="font-medium text-blue-600 hover:underline">
                        {ticket.subject}
                      </Link>
                      <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5">
                        <MessageSquare className="w-3 h-3" /> {ticket._count.messages} replies
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-600">
                      {daysOpened === 0 ? 'Today' : `${daysOpened} ${daysOpened === 1 ? 'day' : 'days'}`}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-500">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
