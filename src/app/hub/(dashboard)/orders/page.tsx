'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    FiPackage, FiRefreshCw, FiFilter, FiArrowRight, FiClock, FiTruck, FiCheckCircle
} from 'react-icons/fi';

interface Order {
    _id: string;
    orderNumber: string;
    buyerId: { _id: string; companyName: string; companyCode: string; contactPerson: string };
    hubId: { _id: string; name: string; city: string };
    quantityTonnes: number;
    totalAmount: number;
    status: string;
    requestedDate: string;
    createdAt: string;
}

interface Stats {
    total: number;
    confirmed: number;
    processing: number;
    dispatched: number;
    delivered: number;
}

export default function HubOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, processing: 0, dispatched: 0, delivered: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadOrders();
    }, [statusFilter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            const res = await fetch(`/api/hub/orders?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data.orders || []);
                setStats(data.data.stats || { total: 0, confirmed: 0, processing: 0, dispatched: 0, delivered: 0 });
            }
        } catch (err) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'processing': return 'bg-cyan-100 text-cyan-700';
            case 'dispatched': return 'bg-purple-100 text-purple-700';
            case 'delivered': return 'bg-green-100 text-green-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'confirmed': return <FiClock className="w-3.5 h-3.5" />;
            case 'processing': return <FiPackage className="w-3.5 h-3.5" />;
            case 'dispatched': return <FiTruck className="w-3.5 h-3.5" />;
            case 'delivered': return <FiCheckCircle className="w-3.5 h-3.5" />;
            default: return null;
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FiPackage className="w-7 h-7 text-teal-500" />
                        Buyer Orders
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage and fulfill buyer orders forwarded by admin</p>
                </div>
                <button onClick={loadOrders}
                    className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700">
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase">Total</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-600 uppercase">New Orders</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{stats.confirmed}</p>
                </div>
                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                    <p className="text-xs text-cyan-600 uppercase">Processing</p>
                    <p className="text-2xl font-bold text-cyan-700 mt-1">{stats.processing}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-xs text-purple-600 uppercase">Dispatched</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{stats.dispatched}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-600 uppercase">Delivered</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{stats.delivered}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-gray-400" />
                {['all', 'confirmed', 'processing', 'dispatched', 'delivered'].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">📦</div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiPackage className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No orders found</p>
                        <p className="text-sm mt-1">Orders will appear here when admin approves buyer requests</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {orders.map((order) => (
                            <div key={order._id}
                                onClick={() => router.push(`/hub/orders/${order._id}`)}
                                className="p-5 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${order.status === 'confirmed' ? 'bg-blue-100' :
                                        order.status === 'processing' ? 'bg-cyan-100' :
                                            order.status === 'dispatched' ? 'bg-purple-100' : 'bg-green-100'
                                    }`}>
                                    {order.status === 'dispatched' ? '🚚' : order.status === 'delivered' ? '✅' : '📦'}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-mono text-teal-600 font-medium">{order.orderNumber}</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status === 'confirmed' ? 'New' : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                    <p className="font-medium text-gray-800">{order.buyerId?.companyName || 'Unknown Buyer'}</p>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        {order.quantityTonnes}T • {formatCurrency(order.totalAmount)} •{' '}
                                        {new Date(order.requestedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center gap-2">
                                    {order.status === 'confirmed' && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                                            Prepare →
                                        </span>
                                    )}
                                    <FiArrowRight className="w-5 h-5 text-gray-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
