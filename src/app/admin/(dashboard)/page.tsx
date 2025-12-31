'use client';

import React, { useState, useEffect } from 'react';
import { FiServer, FiUsers, FiPackage, FiDollarSign, FiMessageCircle, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

interface DashboardStats {
    totalHubs: number;
    activeHubs: number;
    totalFarmers: number;
    totalPickups: number;
    totalInventory: number;
    openTickets: number;
    totalRevenue: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { label: 'Total Hubs', value: stats?.totalHubs || 0, icon: FiServer, color: 'from-purple-500 to-indigo-600', subtext: `${stats?.activeHubs || 0} active` },
        { label: 'Registered Farmers', value: stats?.totalFarmers || 0, icon: FiUsers, color: 'from-green-500 to-emerald-600' },
        { label: 'Total Pickups', value: stats?.totalPickups || 0, icon: FiPackage, color: 'from-blue-500 to-cyan-600' },
        { label: 'Inventory (T)', value: stats?.totalInventory?.toFixed(1) || '0', icon: FiTrendingUp, color: 'from-amber-500 to-orange-600' },
        { label: 'Open Tickets', value: stats?.openTickets || 0, icon: FiMessageCircle, color: 'from-red-500 to-pink-600', alert: (stats?.openTickets || 0) > 0 },
        { label: 'Revenue (₹)', value: formatCurrency(stats?.totalRevenue || 0), icon: FiDollarSign, color: 'from-teal-500 to-green-600' },
    ];

    function formatCurrency(amount: number) {
        if (amount >= 100000) {
            return `${(amount / 100000).toFixed(1)}L`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`;
        }
        return amount.toString();
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 mt-1">Platform overview and key metrics</p>
            </div>

            {/* Stats Grid */}
            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
                            <div className="w-12 h-12 bg-white/10 rounded-xl mb-4" />
                            <div className="h-8 bg-white/10 rounded w-20 mb-2" />
                            <div className="h-4 bg-white/10 rounded w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {statCards.map((stat, idx) => (
                        <div
                            key={idx}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 
                                       hover:bg-white/10 transition-all duration-300"
                        >
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} 
                                           flex items-center justify-center shadow-lg mb-4`}>
                                <stat.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-3xl font-bold text-white">{stat.value}</p>
                                {stat.alert && (
                                    <FiAlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
                            {stat.subtext && (
                                <p className="text-xs text-green-400 mt-1">{stat.subtext}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <a href="/admin/hubs" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <FiServer className="w-5 h-5 text-purple-400" />
                        <span className="text-gray-200 text-sm font-medium">Monitor Hubs</span>
                    </a>
                    <a href="/admin/tickets" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <FiMessageCircle className="w-5 h-5 text-pink-400" />
                        <span className="text-gray-200 text-sm font-medium">View Tickets</span>
                    </a>
                    <a href="/admin/farmers" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <FiUsers className="w-5 h-5 text-green-400" />
                        <span className="text-gray-200 text-sm font-medium">All Farmers</span>
                    </a>
                    <a href="/admin/analytics" className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        <FiTrendingUp className="w-5 h-5 text-amber-400" />
                        <span className="text-gray-200 text-sm font-medium">Analytics</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
