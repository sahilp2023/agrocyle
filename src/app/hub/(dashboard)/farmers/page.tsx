'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiPhone, FiMapPin, FiPackage, FiCalendar, FiCheck, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';

interface RecentPickup {
    bookingId: string;
    cropType: string;
    quantity: number;
    date: string;
}

interface Farmer {
    _id: string;
    name: string;
    phone: string;
    village?: string;
    city?: string;
    pincode?: string;
    kycVerified?: boolean;
    registeredAt: string;
    // Stats
    totalPickups: number;
    totalQuantity: number;
    lastPickupDate?: string;
    firstPickupDate?: string;
    cropTypes: string[];
    recentPickups: RecentPickup[];
}

export default function LinkedFarmersPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [expandedFarmer, setExpandedFarmer] = useState<string | null>(null);

    useEffect(() => {
        loadFarmers();
    }, []);

    const loadFarmers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);

            const res = await fetch(`/api/hub/farmers?hubId=${manager.hub._id}`, {
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

    const filteredFarmers = farmers.filter(farmer => {
        return farmer.name?.toLowerCase().includes(search.toLowerCase()) ||
            farmer.phone?.includes(search) ||
            farmer.village?.toLowerCase().includes(search.toLowerCase());
    });

    const toggleExpand = (farmerId: string) => {
        setExpandedFarmer(expandedFarmer === farmerId ? null : farmerId);
    };

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTimeAgo = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const now = new Date();
        const date = new Date(dateStr);
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return formatDate(dateStr);
    };

    // Summary stats
    const totalFarmers = farmers.length;
    const activeFarmers = farmers.filter(f => f.totalPickups > 0).length;
    const totalCollected = farmers.reduce((sum, f) => sum + (f.totalQuantity || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Linked Farmers</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Farmers in your hub's service area
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-green-600 uppercase">Total Farmers</p>
                        <p className="text-xl font-bold text-green-700">{totalFarmers}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-blue-600 uppercase">Active</p>
                        <p className="text-xl font-bold text-blue-700">{activeFarmers}</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-purple-600 uppercase">Total Collected</p>
                        <p className="text-xl font-bold text-purple-700">{totalCollected.toFixed(1)} T</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search by name, phone, or village..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
            </div>

            {/* Farmers Grid */}
            {loading ? (
                <div className="p-12 text-center">
                    <div className="animate-spin text-4xl">🌾</div>
                </div>
            ) : filteredFarmers.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                    <FiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No farmers found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredFarmers.map((farmer) => (
                        <div
                            key={farmer._id}
                            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Main Card Content */}
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xl font-bold">
                                        {farmer.name?.charAt(0).toUpperCase() || 'F'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-800 truncate">
                                                {farmer.name || 'Unknown Farmer'}
                                            </h3>
                                            {farmer.kycVerified && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                                    <FiCheck className="w-3 h-3" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <FiPhone className="w-3 h-3" />
                                                {farmer.phone}
                                            </span>
                                            {(farmer.village || farmer.city) && (
                                                <span className="flex items-center gap-1">
                                                    <FiMapPin className="w-3 h-3" />
                                                    {farmer.village || farmer.city}
                                                    {farmer.pincode && ` - ${farmer.pincode}`}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Registered: {formatDate(farmer.registeredAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats Row */}
                                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Total Pickups</p>
                                        <p className="text-xl font-bold text-gray-800">{farmer.totalPickups}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Total Collected</p>
                                        <p className="text-xl font-bold text-green-600">{farmer.totalQuantity.toFixed(1)} T</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase">Last Pickup</p>
                                        <p className="text-sm font-medium text-gray-600">
                                            {farmer.lastPickupDate ? formatTimeAgo(farmer.lastPickupDate) : 'Never'}
                                        </p>
                                    </div>
                                </div>

                                {/* Crops Collected */}
                                {farmer.cropTypes.length > 0 && (
                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-gray-400">Crops:</span>
                                        {farmer.cropTypes.map((crop) => (
                                            <span
                                                key={crop}
                                                className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded-full capitalize"
                                            >
                                                {crop}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Expand/Collapse Button */}
                            {farmer.recentPickups.length > 0 && (
                                <>
                                    <button
                                        onClick={() => toggleExpand(farmer._id)}
                                        className="w-full py-2 px-5 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 
                                                   hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {expandedFarmer === farmer._id ? (
                                            <>
                                                Hide Pickup History <FiChevronUp className="w-4 h-4" />
                                            </>
                                        ) : (
                                            <>
                                                View Pickup History <FiChevronDown className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    {/* Recent Pickups (Expanded) */}
                                    {expandedFarmer === farmer._id && (
                                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                                <FiClock className="w-4 h-4" />
                                                Recent Pickups
                                            </h4>
                                            <div className="space-y-2">
                                                {farmer.recentPickups.map((pickup, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                <FiPackage className="w-4 h-4 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800 capitalize">
                                                                    {pickup.cropType} Stubble
                                                                </p>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <FiCalendar className="w-3 h-3" />
                                                                    {formatDate(pickup.date)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-green-600">
                                                                {pickup.quantity.toFixed(1)} T
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
