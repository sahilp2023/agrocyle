'use client';

import React, { useState, useEffect } from 'react';
import { FiMessageCircle, FiSearch, FiClock, FiCheckCircle, FiX, FiSend, FiRefreshCw, FiUser } from 'react-icons/fi';

interface Ticket {
    _id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: string;
    createdByType: 'farmer' | 'hub_manager';
    createdByName: string;
    messages: Array<{ sender: string; message: string; timestamp: string }>;
    createdAt: string;
}

const statusConfig: Record<string, { color: string; label: string }> = {
    open: { color: 'bg-blue-500/20 text-blue-400', label: 'Open' },
    in_progress: { color: 'bg-amber-500/20 text-amber-400', label: 'In Progress' },
    resolved: { color: 'bg-green-500/20 text-green-400', label: 'Resolved' },
    closed: { color: 'bg-gray-500/20 text-gray-400', label: 'Closed' },
};

const categoryLabels: Record<string, string> = {
    payment: '💰 Payment',
    pickup: '🚜 Pickup',
    technical: '🔧 Technical',
    other: '📋 Other',
};

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        loadTickets();
    }, [statusFilter]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({ all: 'true' });
            if (statusFilter !== 'all') params.set('status', statusFilter);

            const res = await fetch(`/api/admin/tickets?${params}`, {
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
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/tickets/${ticketId}`, {
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

    const handleSendReply = async () => {
        if (!viewingTicket || !replyMessage.trim()) return;

        setSending(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/tickets/${viewingTicket._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message: replyMessage, status: 'in_progress' }),
            });

            const data = await res.json();
            if (data.success) {
                setReplyMessage('');
                await loadTicketDetails(viewingTicket._id);
                await loadTickets();
            }
        } catch (error) {
            console.error('Failed to send reply:', error);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!viewingTicket) return;

        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/admin/tickets/${viewingTicket._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            await loadTicketDetails(viewingTicket._id);
            await loadTickets();
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.createdByName.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
        });
    };

    // Stats
    const stats = {
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in_progress').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FiMessageCircle className="w-7 h-7 text-pink-400" />
                        Support Tickets
                    </h1>
                    <p className="text-gray-400 mt-1">Manage all support tickets from farmers and hub managers</p>
                </div>
                <button
                    onClick={loadTickets}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 
                               text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 text-sm">Open</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.open}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-400 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.inProgress}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-400 text-sm">Resolved</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.resolved}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tickets..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                   text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'open', 'in_progress', 'resolved', 'closed'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === status
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {status === 'all' ? 'All' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">🎫</div>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiMessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No tickets found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                onClick={() => loadTicketDetails(ticket._id)}
                                className="p-4 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="text-xs font-mono text-purple-400">{ticket.ticketNumber}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[ticket.status].color}`}>
                                                {statusConfig[ticket.status].label}
                                            </span>
                                            <span className={`text-xs ${ticket.createdByType === 'farmer' ? 'text-green-400' : 'text-blue-400'}`}>
                                                {ticket.createdByType === 'farmer' ? '👨‍🌾 Farmer' : '🏢 Hub Manager'}
                                            </span>
                                        </div>
                                        <h3 className="font-medium text-white truncate">{ticket.subject}</h3>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {categoryLabels[ticket.category] || ticket.category} • {ticket.createdByName} • {formatDate(ticket.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Ticket Modal */}
            {viewingTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col border border-white/10">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/10">
                            <div>
                                <span className="text-xs font-mono text-purple-400">{viewingTicket.ticketNumber}</span>
                                <h3 className="text-lg font-semibold text-white mt-1">{viewingTicket.subject}</h3>
                            </div>
                            <button
                                onClick={() => setViewingTicket(null)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Info Bar */}
                        <div className="px-5 py-3 bg-white/5 border-b border-white/10 flex flex-wrap gap-4 text-sm">
                            <span className={`px-2 py-1 rounded-full ${statusConfig[viewingTicket.status].color}`}>
                                {statusConfig[viewingTicket.status].label}
                            </span>
                            <span className="text-gray-400">{categoryLabels[viewingTicket.category]}</span>
                            <span className="text-gray-400 flex items-center gap-1">
                                <FiUser className="w-3 h-3" />
                                {viewingTicket.createdByName}
                            </span>
                        </div>

                        {/* Status Actions */}
                        <div className="px-5 py-3 border-b border-white/10 flex gap-2">
                            <span className="text-gray-400 text-sm">Set Status:</span>
                            {['in_progress', 'resolved', 'closed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => handleUpdateStatus(status)}
                                    disabled={viewingTicket.status === status}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${viewingTicket.status === status
                                            ? 'bg-white/10 text-gray-500'
                                            : 'bg-purple-600 text-white hover:bg-purple-500'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-xs text-purple-400 font-medium mb-2">Original Issue</p>
                                <p className="text-gray-300 whitespace-pre-wrap">{viewingTicket.description}</p>
                            </div>

                            {viewingTicket.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`rounded-xl p-4 ${msg.sender === 'admin' ? 'bg-green-500/10 ml-8' : 'bg-white/5 mr-8'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-medium ${msg.sender === 'admin' ? 'text-green-400' : 'text-gray-400'
                                            }`}>
                                            {msg.sender === 'admin' ? '🛡️ Admin' : '👤 User'}
                                        </span>
                                        <span className="text-xs text-gray-500">{formatDate(msg.timestamp)}</span>
                                    </div>
                                    <p className="text-gray-300 whitespace-pre-wrap">{msg.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Reply */}
                        {viewingTicket.status !== 'closed' && (
                            <div className="p-4 border-t border-white/10 bg-slate-800">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type admin reply..."
                                        className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl
                                                   text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={sending || !replyMessage.trim()}
                                        className="px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 
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
