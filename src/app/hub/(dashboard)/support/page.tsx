'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiMessageCircle, FiClock, FiCheckCircle, FiX, FiSend, FiAlertCircle } from 'react-icons/fi';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: 'payment' | 'pickup' | 'technical' | 'other';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    messages: Array<{
        sender: 'user' | 'admin';
        message: string;
        timestamp: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    open: { color: 'bg-blue-50 text-blue-700', icon: <FiClock className="w-4 h-4" />, label: 'Open' },
    in_progress: { color: 'bg-amber-50 text-amber-700', icon: <FiMessageCircle className="w-4 h-4" />, label: 'In Progress' },
    resolved: { color: 'bg-green-50 text-green-700', icon: <FiCheckCircle className="w-4 h-4" />, label: 'Resolved' },
    closed: { color: 'bg-gray-50 text-gray-600', icon: <FiCheckCircle className="w-4 h-4" />, label: 'Closed' },
};

const categoryLabels: Record<string, string> = {
    payment: '💰 Payment',
    pickup: '🚜 Pickup',
    technical: '🔧 Technical',
    other: '📋 Other',
};

export default function HubSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);

    // Create form state
    const [category, setCategory] = useState<string>('technical');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<string>('medium');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Reply state
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadTickets();
    }, [statusFilter]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/support?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setTickets(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTicketDetails = async (ticketId: string) => {
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch(`/api/support/${ticketId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setViewingTicket(data.data);
            }
        } catch (error) {
            console.error('Failed to load ticket:', error);
        }
    };

    const handleCreateTicket = async () => {
        if (!subject.trim() || !description.trim()) {
            setCreateError('Subject and description are required');
            return;
        }

        setCreating(true);
        setCreateError('');

        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ category, subject, description, priority }),
            });

            const data = await res.json();
            if (data.success) {
                setCreateModalOpen(false);
                setCategory('technical');
                setSubject('');
                setDescription('');
                setPriority('medium');
                await loadTickets();
            } else {
                setCreateError(data.message || 'Failed to create ticket');
            }
        } catch (error) {
            console.error('Failed to create ticket:', error);
            setCreateError('Network error');
        } finally {
            setCreating(false);
        }
    };

    const handleSendReply = async () => {
        if (!viewingTicket || !replyMessage.trim()) return;

        setSending(true);
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch(`/api/support/${viewingTicket._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: replyMessage }),
            });

            const data = await res.json();
            if (data.success) {
                setReplyMessage('');
                await loadTicketDetails(viewingTicket._id);
            }
        } catch (error) {
            console.error('Failed to send reply:', error);
        } finally {
            setSending(false);
        }
    };

    const handleCloseTicket = async () => {
        if (!viewingTicket) return;

        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch(`/api/support/${viewingTicket._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'closed' }),
            });

            const data = await res.json();
            if (data.success) {
                setViewingTicket(null);
                await loadTickets();
            }
        } catch (error) {
            console.error('Failed to close ticket:', error);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Help & Support</h1>
                    <p className="text-gray-500 text-sm mt-1">Create and manage support tickets</p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                               text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                >
                    <FiPlus className="w-5 h-5" />
                    New Ticket
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-600 uppercase">Open</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">
                        {tickets.filter(t => t.status === 'open').length}
                    </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-600 uppercase">In Progress</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">
                        {tickets.filter(t => t.status === 'in_progress').length}
                    </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-600 uppercase">Resolved</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                        {tickets.filter(t => t.status === 'resolved').length}
                    </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-600 uppercase">Closed</p>
                    <p className="text-2xl font-bold text-gray-700 mt-1">
                        {tickets.filter(t => t.status === 'closed').length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {status === 'all' ? 'All Tickets' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">🎫</div>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiMessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No tickets found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {tickets.map((ticket) => {
                            const status = statusConfig[ticket.status];
                            return (
                                <div
                                    key={ticket._id}
                                    onClick={() => loadTicketDetails(ticket._id)}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono text-blue-600">
                                                    {ticket.ticketNumber}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-gray-800 truncate">{ticket.subject}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {categoryLabels[ticket.category]} • {formatDate(ticket.createdAt)}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {ticket.priority}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Ticket Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-800">Create Support Ticket</h3>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setCategory(key)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${category === key
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="text-sm font-medium">{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPriority(p)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${priority === p
                                                    ? p === 'high' ? 'bg-red-500 text-white' :
                                                        p === 'medium' ? 'bg-amber-500 text-white' : 'bg-gray-500 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Brief summary of your issue"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            {createError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                                    <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {createError}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-medium 
                                           hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTicket}
                                disabled={creating}
                                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                                           text-white font-medium rounded-xl transition-colors"
                            >
                                {creating ? 'Creating...' : 'Create Ticket'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Ticket Modal */}
            {viewingTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <span className="text-xs font-mono text-blue-600">{viewingTicket.ticketNumber}</span>
                                <h3 className="text-lg font-semibold text-gray-800 mt-1">{viewingTicket.subject}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {viewingTicket.status === 'resolved' && (
                                    <button
                                        onClick={handleCloseTicket}
                                        className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                                    >
                                        Close Ticket
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewingTicket(null)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <FiX className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-sm">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig[viewingTicket.status].color}`}>
                                {statusConfig[viewingTicket.status].icon}
                                {statusConfig[viewingTicket.status].label}
                            </span>
                            <span>{categoryLabels[viewingTicket.category]}</span>
                            <span>Created: {formatDate(viewingTicket.createdAt)}</span>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {/* Original description */}
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-medium mb-2">Original Issue</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{viewingTicket.description}</p>
                            </div>

                            {/* Message thread */}
                            {viewingTicket.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-xl p-4 ${msg.sender === 'admin'
                                            ? 'bg-green-50 ml-8'
                                            : 'bg-gray-50 mr-8'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-medium ${msg.sender === 'admin' ? 'text-green-600' : 'text-gray-600'
                                            }`}>
                                            {msg.sender === 'admin' ? '🛡️ Support Team' : '👤 You'}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {formatDate(msg.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Reply Input */}
                        {viewingTicket.status !== 'closed' && (
                            <div className="p-4 border-t border-gray-100 bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl 
                                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={sending || !replyMessage.trim()}
                                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 
                                                   text-white rounded-xl transition-colors"
                                    >
                                        <FiSend className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
