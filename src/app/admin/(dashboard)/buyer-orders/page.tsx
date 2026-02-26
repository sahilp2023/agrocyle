'use client';

import React, { useState, useEffect } from 'react';
import {
    FiPackage, FiSearch, FiRefreshCw, FiFilter, FiCheck, FiX, FiTruck, FiEye
} from 'react-icons/fi';

interface Order {
    _id: string;
    orderNumber: string;
    buyerId: {
        _id: string;
        companyName: string;
        companyCode: string;
        contactPerson: string;
        email: string;
        phone: string;
    };
    hubId: {
        _id: string;
        name: string;
        city: string;
        code: string;
    };
    quantityTonnes: number;
    pricePerTonne: number;
    totalAmount: number;
    status: string;
    requestedDate: string;
    createdAt: string;
    notes?: string;
}

interface Summary {
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    dispatchedOrders: number;
    deliveredOrders: number;
    totalQuantity: number;
    totalRevenue: number;
}

export default function AdminBuyerOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, [statusFilter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.set('status', statusFilter);
            const res = await fetch(`/api/admin/buyer-orders?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setOrders(data.data.orders || []);
                setSummary(data.data.summary);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/buyer-orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId, status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                await loadOrders();
            } else {
                alert(data.error || 'Failed to update order');
            }
        } catch (error) {
            console.error('Failed to update order:', error);
        } finally {
            setUpdating(null);
        }
    };

    const filteredOrders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.buyerId?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        o.hubId?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-500/20 text-amber-400';
            case 'confirmed': return 'bg-blue-500/20 text-blue-400';
            case 'processing': return 'bg-cyan-500/20 text-cyan-400';
            case 'dispatched': return 'bg-purple-500/20 text-purple-400';
            case 'delivered': return 'bg-green-500/20 text-green-400';
            case 'cancelled': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FiPackage className="w-7 h-7 text-emerald-400" />
                        Buyer Orders
                    </h1>
                    <p className="text-gray-400 mt-1">Manage all buyer order requests</p>
                </div>
                <button
                    onClick={loadOrders}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 
                               text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Orders</p>
                    <p className="text-2xl font-bold text-white mt-1">{summary?.totalOrders || 0}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                    <p className="text-amber-300 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{summary?.pendingOrders || 0}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-300 text-sm">Confirmed</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{summary?.confirmedOrders || 0}</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-purple-300 text-sm">Dispatched</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{summary?.dispatchedOrders || 0}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-300 text-sm">Delivered</p>
                    <p className="text-2xl font-bold text-green-400 mt-1">{summary?.deliveredOrders || 0}</p>
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
                        placeholder="Search by order number, buyer, or hub..."
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                                   text-white placeholder-gray-500 focus:border-emerald-500 outline-none"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <FiFilter className="w-5 h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white 
                                   focus:border-emerald-500 outline-none cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Orders Table */}
            {loading ? (
                <div className="bg-white/5 rounded-2xl p-8 animate-pulse">
                    <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/10 rounded" />
                        ))}
                    </div>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                    <FiPackage className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No orders found</p>
                </div>
            ) : (
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="text-left p-4 text-gray-400 font-medium">Order</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Buyer</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Hub</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Qty (T)</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Amount</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <span className="text-emerald-400 font-mono font-medium">{order.orderNumber}</span>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-white font-medium">{order.buyerId?.companyName || 'N/A'}</p>
                                                <p className="text-gray-400 text-sm">{order.buyerId?.companyCode}</p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div>
                                                <p className="text-white">{order.hubId?.name || 'N/A'}</p>
                                                <p className="text-gray-400 text-sm">{order.hubId?.city}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-white font-medium">{order.quantityTonnes}</td>
                                        <td className="p-4 text-emerald-400 font-medium">{formatCurrency(order.totalAmount)}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(order.requestedDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {order.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, 'confirmed')}
                                                            disabled={updating === order._id}
                                                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                                            title="Confirm"
                                                        >
                                                            <FiCheck className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => updateOrderStatus(order._id, 'cancelled')}
                                                            disabled={updating === order._id}
                                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                            title="Cancel"
                                                        >
                                                            <FiX className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                                {(order.status === 'confirmed' || order.status === 'processing') && (
                                                    <span className="text-xs text-cyan-400 italic">→ Forwarded to Hub</span>
                                                )}
                                                {order.status === 'dispatched' && (
                                                    <span className="text-xs text-purple-400 italic">🚚 In Transit</span>
                                                )}
                                                <button
                                                    className="p-2 bg-white/10 text-gray-400 rounded-lg hover:bg-white/20 transition-colors"
                                                    title="View Details"
                                                >
                                                    <FiEye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
