'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiClipboard, FiTruck, FiCheckCircle, FiPackage, FiArrowRight, FiClock } from 'react-icons/fi';

interface HubManager {
    id: string;
    name: string;
    hub: {
        _id: string;
        name: string;
    };
}

interface Stats {
    pendingRequests: number;
    activeAssignments: number;
    completedToday: number;
    totalInventory: number;
}

interface Activity {
    id: string;
    type: 'completion' | 'assignment';
    message: string;
    timestamp: string;
}

export default function HubDashboardPage() {
    const router = useRouter();
    const [manager, setManager] = useState<HubManager | null>(null);
    const [stats, setStats] = useState<Stats>({
        pendingRequests: 0,
        activeAssignments: 0,
        completedToday: 0,
        totalInventory: 0,
    });
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const managerData = localStorage.getItem('hubManager');
        if (managerData) {
            setManager(JSON.parse(managerData));
        }

        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);

            const res = await fetch(`/api/hub/stats?hubId=${manager.hub._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setStats({
                    pendingRequests: data.data.pendingRequests || 0,
                    activeAssignments: data.data.activeAssignments || 0,
                    completedToday: data.data.completedToday || 0,
                    totalInventory: data.data.totalInventory || 0,
                });
                setRecentActivity(data.data.recentActivity || []);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: 'Pending Requests',
            value: stats.pendingRequests,
            icon: FiClipboard,
            color: 'bg-amber-50 text-amber-600 border-amber-200',
            iconBg: 'bg-amber-100',
            href: '/hub/requests',
        },
        {
            label: 'Active Assignments',
            value: stats.activeAssignments,
            icon: FiTruck,
            color: 'bg-blue-50 text-blue-600 border-blue-200',
            iconBg: 'bg-blue-100',
            href: '/hub/assignments',
        },
        {
            label: 'Completed Today',
            value: stats.completedToday,
            icon: FiCheckCircle,
            color: 'bg-green-50 text-green-600 border-green-200',
            iconBg: 'bg-green-100',
            href: '/hub/assignments',
        },
        {
            label: 'Total Inventory (tons)',
            value: stats.totalInventory,
            icon: FiPackage,
            color: 'bg-purple-50 text-purple-600 border-purple-200',
            iconBg: 'bg-purple-100',
            href: '/hub/inventory',
        },
    ];

    const quickActions = [
        { label: 'View Requests', icon: FiClipboard, color: 'bg-blue-50 hover:bg-blue-100 text-blue-600', href: '/hub/requests' },
        { label: 'Manage Fleet', icon: FiTruck, color: 'bg-green-50 hover:bg-green-100 text-green-600', href: '/hub/fleet' },
        { label: 'Inventory', icon: FiPackage, color: 'bg-purple-50 hover:bg-purple-100 text-purple-600', href: '/hub/inventory' },
        { label: 'Process Payout', icon: FiCheckCircle, color: 'bg-amber-50 hover:bg-amber-100 text-amber-600', href: '/hub/payouts' },
    ];

    const formatTimeAgo = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now.getTime() - time.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome back, {manager?.name?.split(' ')[0] || 'Manager'}!
                </h1>
                <p className="text-gray-500 mt-1">
                    {manager?.hub?.name} - Here's what's happening today
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        onClick={() => router.push(stat.href)}
                        className={`
                            rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md
                            ${stat.color}
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-80">{stat.label}</p>
                                <p className="text-3xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.iconBg}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={() => router.push(action.href)}
                            className={`p-4 rounded-xl text-center transition-colors ${action.color}`}
                        >
                            <action.icon className="w-6 h-6 mx-auto mb-2" />
                            <span className="text-sm font-medium text-gray-700">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                    <button
                        onClick={() => router.push('/hub/assignments')}
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        View All <FiArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <FiClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                        <p className="text-sm">Activity will appear here as pickups are processed</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentActivity.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'completion'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    {activity.type === 'completion' ? (
                                        <FiCheckCircle className="w-5 h-5" />
                                    ) : (
                                        <FiTruck className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800">{activity.message}</p>
                                    <p className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
