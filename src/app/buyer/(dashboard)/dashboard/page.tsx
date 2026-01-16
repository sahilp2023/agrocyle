'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiShoppingCart, FiTruck, FiCheck, FiX, FiArrowRight, FiClock } from 'react-icons/fi';

interface Buyer {
    id: string;
    companyName: string;
    contactPerson: string;
}

interface Stats {
    totalOrdered: number;
    totalReceived: number;
    pendingDeliveries: number;
    acceptedCount: number;
    rejectedCount: number;
    ordersByStatus: Record<string, number>;
}

interface RecentOrder {
    _id: string;
    orderNumber: string;
    quantityTonnes: number;
    status: string;
    hubId: { name: string; city: string };
    createdAt: string;
}

export default function BuyerDashboardPage() {
    const router = useRouter();
    const [buyer, setBuyer] = useState<Buyer | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalOrdered: 0,
        totalReceived: 0,
        pendingDeliveries: 0,
        acceptedCount: 0,
        rejectedCount: 0,
        ordersByStatus: {},
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const buyerData = localStorage.getItem('buyer');
        if (buyerData) {
            setBuyer(JSON.parse(buyerData));
        }
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('buyerToken');
            const res = await fetch('/api/buyer/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setStats(data.data.stats);
                setRecentOrders(data.data.recentOrders || []);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Total Ordered',
            value: `${stats.totalOrdered} tons`,
            icon: FiShoppingCart,
            color: 'bg-blue-50 text-blue-600 border-blue-200',
            iconBg: 'bg-blue-100',
        },
        {
            label: 'Total Received',
            value: `${stats.totalReceived} tons`,
            icon: FiTruck,
            color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            iconBg: 'bg-emerald-100',
        },
        {
            label: 'Pending Deliveries',
            value: stats.pendingDeliveries,
            icon: FiClock,
            color: 'bg-amber-50 text-amber-600 border-amber-200',
            iconBg: 'bg-amber-100',
        },
        {
            label: 'Accepted',
            value: stats.acceptedCount,
            icon: FiCheck,
            color: 'bg-green-50 text-green-600 border-green-200',
            iconBg: 'bg-green-100',
        },
        {
            label: 'Rejected',
            value: stats.rejectedCount,
            icon: FiX,
            color: 'bg-red-50 text-red-600 border-red-200',
            iconBg: 'bg-red-100',
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'dispatched': return 'bg-purple-100 text-purple-700';
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin text-4xl">🏭</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome back, {buyer?.contactPerson?.split(' ')[0] || 'Buyer'}!
                </h1>
                <p className="text-gray-500 mt-1">
                    {buyer?.companyName} - Here's your overview
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className={`rounded-xl border-2 p-4 transition-all hover:shadow-md ${stat.color}`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium opacity-80">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                        onClick={() => router.push('/buyer/orders/create')}
                        className="p-4 rounded-xl text-center transition-colors bg-emerald-50 hover:bg-emerald-100"
                    >
                        <FiShoppingCart className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                        <span className="text-sm font-medium text-gray-700">Create Order</span>
                    </button>
                    <button
                        onClick={() => router.push('/buyer/orders')}
                        className="p-4 rounded-xl text-center transition-colors bg-blue-50 hover:bg-blue-100"
                    >
                        <FiClock className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">View Orders</span>
                    </button>
                    <button
                        onClick={() => router.push('/buyer/deliveries')}
                        className="p-4 rounded-xl text-center transition-colors bg-purple-50 hover:bg-purple-100"
                    >
                        <FiTruck className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">Track Deliveries</span>
                    </button>
                    <button
                        onClick={() => router.push('/buyer/quality')}
                        className="p-4 rounded-xl text-center transition-colors bg-amber-50 hover:bg-amber-100"
                    >
                        <FiCheck className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                        <span className="text-sm font-medium text-gray-700">Quality Settings</span>
                    </button>
                </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
                    <button
                        onClick={() => router.push('/buyer/orders')}
                        className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                        View All <FiArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {recentOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <FiShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No orders yet</p>
                        <button
                            onClick={() => router.push('/buyer/orders/create')}
                            className="mt-3 text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                        >
                            Create your first order
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="pb-3">Order #</th>
                                    <th className="pb-3">Hub</th>
                                    <th className="pb-3">Quantity</th>
                                    <th className="pb-3">Status</th>
                                    <th className="pb-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {recentOrders.map((order) => (
                                    <tr
                                        key={order._id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => router.push(`/buyer/orders`)}
                                    >
                                        <td className="py-3 text-sm font-medium text-gray-800">
                                            {order.orderNumber}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                            {order.hubId?.name || 'N/A'}
                                        </td>
                                        <td className="py-3 text-sm text-gray-600">
                                            {order.quantityTonnes} tons
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-sm text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
