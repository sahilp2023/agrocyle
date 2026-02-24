'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiChevronRight, FiPackage, FiClock, FiCheck, FiX, FiUser, FiPhone } from 'react-icons/fi';

interface Job {
    _id: string;
    operatorStatus: string;
    status: string;
    assignedAt: string;
    completedAt?: string;
    estimatedEarning?: number;
    actualQuantityTonnes?: number;
    baleCount?: number;
    bookingId?: {
        cropType: string;
        estimatedStubbleTonnes: number;
        scheduledPickupDate?: string;
        farmerId?: { name: string; phone: string; village?: string };
        farmId?: { plotName: string; areaAcre: number };
    };
    hubId?: { name: string; city: string };
}

const statusBadge: Record<string, { label: string; color: string }> = {
    pending: { label: 'New Job', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-700' },
    en_route: { label: 'En Route', color: 'bg-cyan-100 text-cyan-700' },
    arrived: { label: 'Arrived', color: 'bg-teal-100 text-teal-700' },
    work_started: { label: 'Working', color: 'bg-orange-100 text-orange-700' },
    work_complete: { label: 'Under Review', color: 'bg-amber-100 text-amber-700' },
    delivered: { label: 'Completed', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
};

type TabKey = 'incoming' | 'active' | 'history';

export default function OperatorJobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>('incoming');

    const tabs: { key: TabKey; label: string; emoji: string }[] = [
        { key: 'incoming', label: 'Incoming', emoji: '📩' },
        { key: 'active', label: 'Active', emoji: '🚜' },
        { key: 'history', label: 'History', emoji: '📋' },
    ];

    useEffect(() => {
        loadJobs();
    }, [tab]);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('operatorToken');
            const res = await fetch(`/api/operator/jobs?status=${tab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setJobs(data.data.jobs || []);
            }
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAction = async (jobId: string, newStatus: string) => {
        try {
            const token = localStorage.getItem('operatorToken');
            const res = await fetch('/api/operator/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ assignmentId: jobId, operatorStatus: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                await loadJobs();
            }
        } catch (error) {
            console.error('Failed to update job:', error);
        }
    };

    return (
        <div className="p-4 space-y-4">
            <h1 className="text-xl font-bold text-gray-800">My Jobs</h1>

            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.key
                                ? 'bg-white text-orange-600 shadow-sm'
                                : 'text-gray-500'
                            }`}>
                        {t.emoji} {t.label}
                    </button>
                ))}
            </div>

            {/* Jobs List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin text-4xl">🚜</div>
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-4xl mb-2">
                        {tab === 'incoming' ? '📭' : tab === 'active' ? '🎯' : '📋'}
                    </p>
                    <p className="text-gray-500 text-sm">
                        {tab === 'incoming' ? 'No new jobs right now' :
                            tab === 'active' ? 'No active jobs' : 'No completed jobs yet'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {jobs.map(job => {
                        const badge = statusBadge[job.operatorStatus] || statusBadge.pending;
                        const farmer = job.bookingId?.farmerId;
                        const farm = job.bookingId?.farmId;

                        return (
                            <div key={job._id}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                {/* Card header - tap to open detail */}
                                <div onClick={() => router.push(`/operator/jobs/${job._id}`)}
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(job.assignedAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short',
                                                    })}
                                                </span>
                                            </div>

                                            {/* Farmer name & location */}
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <FiUser className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {farmer?.name || 'Farmer'}
                                                </span>
                                            </div>
                                            {farmer?.phone && (
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <FiPhone className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-xs text-gray-500">+91 {farmer.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    {farm?.plotName || farmer?.village || 'Work Location'}
                                                    {farm?.areaAcre ? ` • ${farm.areaAcre} acres` : ''}
                                                </span>
                                            </div>
                                        </div>
                                        <FiChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-2" />
                                    </div>

                                    {/* Crop info row */}
                                    <div className="flex gap-4 mt-3 pt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <FiPackage className="w-3 h-3" />
                                            <span className="capitalize">{job.bookingId?.cropType || '-'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <span>📦</span>
                                            <span>{job.bookingId?.estimatedStubbleTonnes || '-'}T est.</span>
                                        </div>
                                        {job.hubId && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <span>🏢</span>
                                                <span>{job.hubId.name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick actions for incoming jobs */}
                                {job.operatorStatus === 'pending' && (
                                    <div className="flex border-t border-gray-100">
                                        <button onClick={(e) => { e.stopPropagation(); handleQuickAction(job._id, 'rejected'); }}
                                            className="flex-1 py-2.5 text-red-600 text-sm font-medium flex items-center justify-center gap-1 hover:bg-red-50 border-r border-gray-100">
                                            <FiX className="w-4 h-4" /> Reject
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleQuickAction(job._id, 'accepted'); }}
                                            className="flex-1 py-2.5 text-green-600 text-sm font-medium flex items-center justify-center gap-1 hover:bg-green-50">
                                            <FiCheck className="w-4 h-4" /> Accept
                                        </button>
                                    </div>
                                )}

                                {/* Status for work_complete */}
                                {job.operatorStatus === 'work_complete' && (
                                    <div className="px-4 pb-3">
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center text-xs text-amber-700">
                                            ⏳ Waiting for hub manager review
                                        </div>
                                    </div>
                                )}

                                {/* Completed info */}
                                {job.status === 'completed' && job.actualQuantityTonnes && (
                                    <div className="px-4 pb-3">
                                        <div className="flex gap-4 text-xs text-gray-500">
                                            <span>✅ {job.actualQuantityTonnes}T bailed</span>
                                            {job.completedAt && (
                                                <span>
                                                    <FiClock className="w-3 h-3 inline" /> {new Date(job.completedAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short',
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
