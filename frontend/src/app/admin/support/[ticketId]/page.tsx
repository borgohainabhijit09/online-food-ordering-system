'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Send } from 'lucide-react';
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

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: string;
  createdAt: string;
  messages: Message[];
}

export default function TicketDetailsPage() {
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
      const res = await apiClient.get(`/api/support/${ticketId}`);
      if (res.ok) {
        setTicket(await res.json());
      } else {
        router.push('/admin/support');
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
      const res = await apiClient.post(`/api/support/${ticketId}/messages`, { content: replyContent });
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
      const res = await apiClient.patch(`/api/support/${ticketId}/status`, { status: newStatus });
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
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/support" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{ticket.subject}</h2>
            <div className="text-sm text-neutral-500 flex items-center gap-2 mt-1">
              <span>#{ticket.id.split('-')[0]}</span>
              <span>•</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span className="font-medium text-orange-600">{ticket.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') && (
            <button 
              onClick={() => updateStatus('OPEN')}
              disabled={isUpdatingStatus}
              className="flex items-center gap-2 px-4 py-2 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden flex flex-col h-[600px] shadow-sm">
        {/* Chat Header / Original Issue */}
        <div className="p-6 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <h3 className="font-bold text-sm text-neutral-500 mb-2">ORIGINAL ISSUE</h3>
          <p className="text-neutral-900 dark:text-neutral-100 whitespace-pre-wrap">{ticket.description}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {ticket.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
              No replies yet. We will get back to you soon.
            </div>
          ) : (
            ticket.messages.map((msg) => {
              const isMine = !msg.isSuperAdmin;
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-neutral-500">
                      {isMine ? 'You' : 'RestoBuddy Support'}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] ${isMine ? 'bg-orange-600 text-white rounded-tr-sm' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-tl-sm'}`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Box */}
        {ticket.status !== 'CLOSED' && (
          <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
            <form onSubmit={handleReply} className="flex gap-2">
              <input 
                type="text" 
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button 
                type="submit"
                disabled={isSending || !replyContent.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors shrink-0"
              >
                {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        )}
        
        {ticket.status === 'CLOSED' && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm text-neutral-500">
            This ticket has been closed. If you have further issues, please open a new ticket.
          </div>
        )}
      </div>
    </div>
  );
}
