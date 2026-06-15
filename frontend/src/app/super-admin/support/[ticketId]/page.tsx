'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  role: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  isSuperAdmin: boolean;
  user: User;
}

interface Tenant {
  id: string;
  businessName: string;
  email: string;
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: string;
  createdAt: string;
  messages: Message[];
  tenant: Tenant;
}

export default function SuperAdminTicketDetailsPage() {
  const params = useParams();
  const ticketId = params.ticketId as string;
  const router = useRouter();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const res = await apiClient.get(`/api/super-admin/support/tickets/${ticketId}`);
      if (res.ok) {
        setTicket(await res.json());
      } else {
        router.push('/super-admin/support');
      }
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setIsSending(true);
    try {
      const res = await apiClient.post(`/api/super-admin/support/tickets/${ticketId}/messages`, { content: replyContent });
      if (res.ok) {
        setReplyContent('');
        fetchTicket(); // Refresh to get the new message
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const res = await apiClient.patch(`/api/super-admin/support/tickets/${ticketId}/status`, { status: newStatus });
      if (res.ok) {
        fetchTicket();
      }
    } catch (error) {
      console.error('Failed to update status', error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>;
  }

  if (!ticket) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/super-admin/support" className="p-2 hover:bg-neutral-200 rounded-lg transition-colors text-neutral-900 dark:text-neutral-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{ticket.subject}</h2>
            <div className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
              <span>Tenant: {ticket.tenant?.businessName || 'Unknown'}</span>
              <span>•</span>
              <span>#{ticket.id.split('-')[0]}</span>
              <span>•</span>
              <span className="font-medium text-black">{ticket.status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
            <button 
              onClick={() => updateStatus('RESOLVED')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" /> Mark as Resolved
            </button>
          )}
          {ticket.status !== 'CLOSED' && (
            <button 
              onClick={() => updateStatus('CLOSED')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Close Ticket
            </button>
          )}
          {(ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') && (
            <button 
              onClick={() => updateStatus('OPEN')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-sm">
        {/* Chat Header / Original Issue */}
        <div className="p-6 bg-neutral-50 border-b border-neutral-200 shrink-0">
          <h3 className="font-bold text-sm text-neutral-500 mb-2">ORIGINAL ISSUE</h3>
          <p className="text-black whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {ticket.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
              No replies yet. Send a message to start the conversation.
            </div>
          ) : (
            ticket.messages.map((msg) => {
              const isMine = msg.isSuperAdmin;
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-500">
                      {isMine ? 'You (Support)' : (ticket.tenant?.businessName || 'Customer')}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${isMine ? 'bg-black text-white rounded-tr-sm' : 'bg-neutral-100 text-black rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Box */}
        {ticket.status !== 'CLOSED' && (
          <div className="p-4 bg-white border-t border-neutral-200 shrink-0">
            <form onSubmit={handleReply} className="flex gap-2">
              <input 
                type="text" 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply to the customer..."
                className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black text-black"
              />
              <button 
                type="submit"
                disabled={isSending || !replyContent.trim()}
                className="bg-black hover:bg-neutral-800 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shrink-0"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        )}
        
        {ticket.status === 'CLOSED' && (
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-center text-sm text-neutral-500">
            This ticket is closed. Reopen the ticket to send a message.
          </div>
        )}
      </div>
    </div>
  );
}
