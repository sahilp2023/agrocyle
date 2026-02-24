'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiPhone, FiTruck, FiCheck, FiX, FiClock, FiStar, FiMapPin } from 'react-icons/fi';

interface OperatorData {
    _id: string;
    name: string;
    phone: string;
    operatorType: string;
    vehicleNumber: string;
    vehicleModel?: string;
    licenseNumber?: string;
    upiId?: string;
    isVerified: boolean;
    isOnline: boolean;
    totalJobs: number;
    totalEarnings: number;
    rating?: number;
    createdAt: string;
}

interface Counts {
    total: number;
    pending: number;
    verified: number;
}

export default function HubOperatorsPage() {
    const [tab, setTab] = useState<'pending' | 'verified'>('pending');
    const [operators, setOperators] = useState<OperatorData[]>([]);
    const [counts, setCounts] = useState<Counts>({ total: 0, pending: 0, verified: 0 });
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadOperators();
    }, [tab]);

    const loadOperators = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch(`/api/hub/operators?tab=${tab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setOperators(data.data.operators || []);
                setCounts(data.data.counts || { total: 0, pending: 0, verified: 0 });
            }
        } catch (error) {
            console.error('Failed to load operators:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (operatorId: string, action: 'verify' | 'reject') => {
        setActionLoading(operatorId);
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch('/api/hub/operators', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ operatorId, action }),
            });
            const data = await res.json();
            if (data.success) {
                loadOperators();
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filtered = operators.filter(op =>
        op.name.toLowerCase().includes(search.toLowerCase()) ||
        op.phone.includes(search) ||
        op.vehicleNumber.toLowerCase().includes(search.toLowerCase())
    );

    const operatorTypeLabel = (type: string) => {
        if (type === 'both') return 'Baler & Truck';
        return type === 'baler' ? 'Baler' : 'Truck';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Operators</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {counts.total} total • {counts.pending} pending approval • {counts.verified} verified
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                <button onClick={() => setTab('pending')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                        ${tab === 'pending'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                    <FiClock className="w-4 h-4" /> Onboarding
                    {counts.pending > 0 && (
                        <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{counts.pending}</span>
                    )}
                </button>
                <button onClick={() => setTab('verified')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2
                        ${tab === 'verified'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}`}>
                    <FiCheck className="w-4 h-4" /> Active ({counts.verified})
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, or vehicle..."
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 text-sm" />
            </div>

            {/* Operators List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin text-3xl">🚜</div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <span className="text-4xl">{tab === 'pending' ? '📭' : '👷'}</span>
                    <h3 className="text-lg font-semibold text-gray-700 mt-3">
                        {tab === 'pending' ? 'No pending operators' : 'No verified operators'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {tab === 'pending'
                            ? 'When operators register and select your hub, they will appear here for approval.'
                            : 'Verify pending operators to add them to your active fleet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(op => (
                        <div key={op._id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl
                                        ${op.isOnline ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        {op.operatorType === 'truck' ? '🚛' : '🚜'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{op.name}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1"><FiPhone className="w-3 h-3" /> +91 {op.phone}</span>
                                            <span className="flex items-center gap-1"><FiTruck className="w-3 h-3" /> {op.vehicleNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                                {operatorTypeLabel(op.operatorType)}
                                            </span>
                                            {op.vehicleModel && (
                                                <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full">
                                                    {op.vehicleModel}
                                                </span>
                                            )}
                                            {op.isOnline && (
                                                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right side — stats or actions */}
                                <div className="text-right">
                                    {tab === 'verified' ? (
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{op.totalJobs} jobs</p>
                                            <p className="text-xs text-gray-400">₹{(op.totalEarnings || 0).toLocaleString()}</p>
                                            <div className="flex items-center gap-1 mt-1 justify-end">
                                                <FiStar className="w-3 h-3 text-yellow-500" />
                                                <span className="text-xs text-gray-500">{op.rating || '5.0'}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">
                                            {new Date(op.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Pending actions */}
                            {tab === 'pending' && (
                                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                                    <button onClick={() => handleAction(op._id, 'reject')}
                                        disabled={actionLoading === op._id}
                                        className="flex-1 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium
                                            hover:bg-red-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                                        <FiX className="w-4 h-4" /> Reject
                                    </button>
                                    <button onClick={() => handleAction(op._id, 'verify')}
                                        disabled={actionLoading === op._id}
                                        className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium
                                            hover:bg-green-700 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                                        <FiCheck className="w-4 h-4" /> Approve & Add to Fleet
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
