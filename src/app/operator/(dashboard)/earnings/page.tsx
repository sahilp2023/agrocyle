'use client';

import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiTrendingUp, FiCalendar, FiPackage } from 'react-icons/fi';

interface Job {
    _id: string;
    completedAt?: string;
    estimatedEarning?: number;
    actualQuantityTonnes?: number;
    baleCount?: number;
    bookingId?: {
        cropType: string;
        farmerId?: { name: string };
    };
}

export default function OperatorEarningsPage() {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [stats, setStats] = useState<{
        earnings: { daily: number; weekly: number; monthly: number; allTime: number };
        performance: { totalCompleted: number };
    } | null>(null);
    const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem('operatorToken');
        if (!token) return;

        try {
            const [statsRes, jobsRes] = await Promise.all([
                fetch('/api/operator/stats', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/operator/jobs?status=history&limit=20', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const [statsData, jobsData] = await Promise.all([statsRes.json(), jobsRes.json()]);

            if (statsData.success) setStats(statsData.data);
            if (jobsData.success) setCompletedJobs(jobsData.data?.jobs || []);
        } catch (error) {
            console.error('Earnings fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentEarning = stats?.earnings[period] || 0;

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-4xl">💰</div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-gray-800">Earnings</h1>

            {/* Earning Hero Card */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
                {/* Period Selector */}
                <div className="flex bg-white/20 rounded-lg p-0.5 mb-4">
                    {(['daily', 'weekly', 'monthly'] as const).map(p => (
                        <button key={p} onClick={() => setPeriod(p)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all capitalize
                                ${period === p ? 'bg-white text-orange-600' : 'text-white/80'}`}>
                            {p}
                        </button>
                    ))}
                </div>

                <p className="text-sm text-white/70 flex items-center gap-1">
                    <FiCalendar className="w-3.5 h-3.5" />
                    {period === 'daily' ? "Today's" : period === 'weekly' ? 'This Week' : 'This Month'} Earnings
                </p>
                <p className="text-4xl font-bold mt-1">₹{currentEarning.toLocaleString()}</p>

                <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                        <FiTrendingUp className="w-3.5 h-3.5" />
                        All Time: ₹{(stats?.earnings.allTime || 0).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                    <FiDollarSign className="w-5 h-5 mx-auto text-green-500" />
                    <p className="text-lg font-bold text-gray-800 mt-1">₹{(stats?.earnings.daily || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Today</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                    <FiDollarSign className="w-5 h-5 mx-auto text-blue-500" />
                    <p className="text-lg font-bold text-gray-800 mt-1">₹{(stats?.earnings.weekly || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 uppercase">This Week</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                    <FiPackage className="w-5 h-5 mx-auto text-orange-500" />
                    <p className="text-lg font-bold text-gray-800 mt-1">{stats?.performance.totalCompleted || 0}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Jobs Done</p>
                </div>
            </div>

            {/* Job-wise Earnings */}
            <div>
                <h2 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wider">Recent Jobs</h2>
                {completedJobs.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                        <span className="text-3xl">📋</span>
                        <p className="text-gray-500 mt-2 text-sm">No completed jobs yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {completedJobs.map(job => (
                            <div key={job._id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">
                                        {job.bookingId?.farmerId?.name || 'Farmer'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric',
                                        }) : ''} • {job.bookingId?.cropType || 'Crop'}
                                        {job.actualQuantityTonnes ? ` • ${job.actualQuantityTonnes}T` : ''}
                                    </p>
                                </div>
                                <span className="font-bold text-green-600">
                                    +₹{(job.estimatedEarning || 0).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
