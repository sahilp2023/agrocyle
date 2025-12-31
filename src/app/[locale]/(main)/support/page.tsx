'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiPlus, FiMessageCircle, FiClock, FiCheckCircle, FiX, FiSend, FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

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

export default function FarmerSupportPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);

    // Create form state
    const [category, setCategory] = useState<string>('pickup');
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
    }, []);

    const getToken = () => {
        return localStorage.getItem('token') || localStorage.getItem('farmerToken');
    };

    const loadTickets = async () => {
        setLoading(true);
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch('/api/support', {
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
            const token = getToken();
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
            const token = getToken();
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
                setCategory('pickup');
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
            const token = getToken();
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
            const token = getToken();
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/en" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <FiArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Help & Support</h1>
                            <p className="text-xs text-gray-500">Get help with your pickups and payments</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 
                                   text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                    >
                        <FiPlus className="w-4 h-4" />
                        New Ticket
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-blue-600 font-medium uppercase">Open</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {tickets.filter(t => t.status === 'open').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-amber-600 font-medium uppercase">In Progress</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {tickets.filter(t => t.status === 'in_progress').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-green-600 font-medium uppercase">Resolved</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {tickets.filter(t => t.status === 'resolved').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <p className="text-xs text-gray-500 font-medium uppercase">Closed</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {tickets.filter(t => t.status === 'closed').length}
                        </p>
                    </div>
                </div>

                {/* Tickets List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-800">Your Tickets</h2>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin text-4xl">🎫</div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <FiMessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No tickets yet</p>
                            <p className="text-sm mt-1">Create a new ticket if you need help</p>
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
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-xs font-mono text-green-600">
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
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Ticket Modal */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-800">Create Support Ticket</h3>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">What do you need help with?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(categoryLabels).map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setCategory(key)}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${category === key
                                                    ? 'border-green-500 bg-green-50'
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">How urgent is this?</label>
                                <div className="flex gap-2">
                                    {[
                                        { key: 'low', label: 'Not Urgent', emoji: '🟢' },
                                        { key: 'medium', label: 'Normal', emoji: '🟡' },
                                        { key: 'high', label: 'Urgent', emoji: '🔴' },
                                    ].map((p) => (
                                        <button
                                            key={p.key}
                                            type="button"
                                            onClick={() => setPriority(p.key)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${priority === p.key
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {p.emoji} {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Brief Title</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g., Payment not received"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Describe Your Issue</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Please provide details about your issue..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                                />
                            </div>

                            {createError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                                    <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {createError}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
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
                                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
                                           text-white font-medium rounded-xl transition-colors"
                            >
                                {creating ? 'Submitting...' : 'Submit Ticket'}
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
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <span className="text-xs font-mono text-green-600">{viewingTicket.ticketNumber}</span>
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
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-sm">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${statusConfig[viewingTicket.status].color}`}>
                                {statusConfig[viewingTicket.status].icon}
                                {statusConfig[viewingTicket.status].label}
                            </span>
                            <span>{categoryLabels[viewingTicket.category]}</span>
                            <span>Created: {formatDate(viewingTicket.createdAt)}</span>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Original description */}
                            <div className="bg-green-50 rounded-xl p-4">
                                <p className="text-xs text-green-600 font-medium mb-2">Your Issue</p>
                                <p className="text-gray-700 whitespace-pre-wrap">{viewingTicket.description}</p>
                            </div>

                            {/* Message thread */}
                            {viewingTicket.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-xl p-4 ${msg.sender === 'admin'
                                            ? 'bg-blue-50 ml-8'
                                            : 'bg-gray-50 mr-8'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-medium ${msg.sender === 'admin' ? 'text-blue-600' : 'text-gray-600'
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
                                        placeholder="Add a message..."
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl 
                                                   focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={sending || !replyMessage.trim()}
                                        className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
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
