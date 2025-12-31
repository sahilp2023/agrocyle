'use client';

import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiRefreshCw, FiPackage, FiDollarSign, FiUsers, FiServer } from 'react-icons/fi';

interface Analytics {
    monthlyPickups: { month: string; count: number }[];
    hubUtilization: { hub: string; percent: number }[];
    totalStock: number;
    totalPickups: number;
    totalRevenue: number;
    totalFarmers: number;
    avgPickupValue: number;
}

export default function AdminAnalyticsPage() {
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/analytics', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setAnalytics(data.data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FiTrendingUp className="w-7 h-7 text-amber-400" />
                        Analytics
                    </h1>
                    <p className="text-gray-400 mt-1">Platform-wide metrics and insights</p>
                </div>
                <button
                    onClick={loadAnalytics}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 
                               text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
                            <div className="h-8 bg-white/10 rounded w-20 mb-2" />
                            <div className="h-4 bg-white/10 rounded w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-2xl p-6">
                            <FiPackage className="w-8 h-8 text-blue-400 mb-3" />
                            <p className="text-3xl font-bold text-white">{analytics?.totalPickups || 0}</p>
                            <p className="text-gray-400 text-sm mt-1">Total Pickups</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20 rounded-2xl p-6">
                            <FiDollarSign className="w-8 h-8 text-green-400 mb-3" />
                            <p className="text-3xl font-bold text-white">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                            <p className="text-gray-400 text-sm mt-1">Total Revenue</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-2xl p-6">
                            <FiUsers className="w-8 h-8 text-purple-400 mb-3" />
                            <p className="text-3xl font-bold text-white">{analytics?.totalFarmers || 0}</p>
                            <p className="text-gray-400 text-sm mt-1">Registered Farmers</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-2xl p-6">
                            <FiServer className="w-8 h-8 text-amber-400 mb-3" />
                            <p className="text-3xl font-bold text-white">{analytics?.totalStock?.toFixed(1) || 0} T</p>
                            <p className="text-gray-400 text-sm mt-1">Total Inventory</p>
                        </div>
                    </div>

                    {/* Monthly Pickups Chart */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Monthly Pickups</h2>
                        <div className="flex items-end gap-2 h-48">
                            {(analytics?.monthlyPickups || []).map((item, idx) => {
                                const maxCount = Math.max(...(analytics?.monthlyPickups || []).map(m => m.count), 1);
                                const height = (item.count / maxCount) * 100;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                        <div
                                            className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all duration-500"
                                            style={{ height: `${height}%`, minHeight: '4px' }}
                                        />
                                        <span className="text-xs text-gray-500">{item.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hub Utilization */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Hub Capacity Utilization</h2>
                        <div className="space-y-4">
                            {(analytics?.hubUtilization || []).map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">{item.hub}</span>
                                        <span className={`font-medium ${item.percent >= 80 ? 'text-red-400' :
                                                item.percent >= 60 ? 'text-amber-400' : 'text-green-400'
                                            }`}>{item.percent}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${item.percent >= 80 ? 'bg-red-500' :
                                                    item.percent >= 60 ? 'bg-amber-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${item.percent}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Average Metrics */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-white mb-4">Key Insights</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-gray-400 text-sm">Average Pickup Value</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {formatCurrency(analytics?.avgPickupValue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                                <p className="text-gray-400 text-sm">Avg Pickups per Farmer</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    {analytics?.totalFarmers ? (analytics.totalPickups / analytics.totalFarmers).toFixed(1) : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
