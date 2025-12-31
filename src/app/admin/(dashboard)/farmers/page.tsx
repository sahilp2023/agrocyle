'use client';

import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiRefreshCw, FiPhone, FiMapPin, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface Farmer {
    _id: string;
    name: string;
    phone: string;
    village?: string;
    city?: string;
    state?: string;
    pincode?: string;
    isVerified: boolean;
    isKYCDone: boolean;
    totalPickups: number;
    totalEarnings: number;
    createdAt: string;
}

export default function AdminFarmersPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadFarmers();
    }, []);

    const loadFarmers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/farmers', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setFarmers(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load farmers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.phone.includes(search) ||
        f.village?.toLowerCase().includes(search.toLowerCase()) ||
        f.city?.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    // Stats
    const stats = {
        total: farmers.length,
        verified: farmers.filter(f => f.isVerified).length,
        kycDone: farmers.filter(f => f.isKYCDone).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FiUsers className="w-7 h-7 text-green-400" />
                        All Farmers
                    </h1>
                    <p className="text-gray-400 mt-1">View and manage all registered farmers</p>
                </div>
                <button
                    onClick={loadFarmers}
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 
                               text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Total Farmers</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                    <p className="text-green-400 text-sm">Verified</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.verified}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 text-sm">KYC Done</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.kycDone}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, or location..."
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               text-white placeholder-gray-500 focus:border-purple-500 outline-none"
                />
            </div>

            {/* Farmers Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">👨‍🌾</div>
                    </div>
                ) : filteredFarmers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No farmers found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-white/5 text-left text-xs uppercase tracking-wide text-gray-400">
                                    <th className="px-6 py-4">Farmer</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Pickups</th>
                                    <th className="px-6 py-4">Earnings</th>
                                    <th className="px-6 py-4">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredFarmers.map((farmer) => (
                                    <tr key={farmer._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-semibold text-sm">
                                                        {farmer.name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="text-white font-medium">{farmer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-300">
                                                <FiPhone className="w-4 h-4 text-gray-500" />
                                                {farmer.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                                                <FiMapPin className="w-4 h-4" />
                                                {[farmer.village, farmer.city].filter(Boolean).join(', ') || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${farmer.isVerified
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {farmer.isVerified ? <FiCheckCircle className="w-3 h-3" /> : <FiXCircle className="w-3 h-3" />}
                                                    {farmer.isVerified ? 'Verified' : 'Unverified'}
                                                </span>
                                                {farmer.isKYCDone && (
                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                                                        KYC ✓
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{farmer.totalPickups}</td>
                                        <td className="px-6 py-4 text-green-400 font-medium">₹{farmer.totalEarnings.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(farmer.createdAt)}</td>
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
