'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiServer, FiSearch, FiRefreshCw, FiMapPin, FiEye, FiPlus, FiX } from 'react-icons/fi';

interface Hub {
    _id: string;
    name: string;
    city: string;
    state: string;
    isActive: boolean;
    currentStock: number;
    capacity: number;
    capacityPercent: number;
    manager: { name: string; email: string } | null;
    qualityGood: number;
    qualityHighMoisture: number;
}

interface Summary {
    totalHubs: number;
    totalStock: number;
    avgCapacity: number;
    highCapacityHubs: number;
}

export default function AdminHubsPage() {
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [addHubOpen, setAddHubOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // New Hub Form
    const [hubForm, setHubForm] = useState({
        name: '', code: '', city: '', state: '', address: '', contactPhone: '', pincodes: '', capacity: '500',
        managerName: '', managerEmail: '', managerPhone: '', managerPassword: '',
    });

    useEffect(() => {
        loadHubs();
    }, []);

    const loadHubs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/hubs', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setHubs(data.data.hubs || []);
                setSummary(data.data.summary);
            }
        } catch (error) {
            console.error('Failed to load hubs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateHub = async () => {
        if (!hubForm.name || !hubForm.code || !hubForm.city || !hubForm.state) {
            alert('Name, code, city and state are required');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/hubs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: hubForm.name,
                    code: hubForm.code,
                    city: hubForm.city,
                    state: hubForm.state,
                    address: hubForm.address,
                    contactPhone: hubForm.contactPhone,
                    servicePincodes: hubForm.pincodes.split(',').map(p => p.trim()).filter(Boolean),
                    capacity: parseInt(hubForm.capacity) || 500,
                    manager: hubForm.managerEmail ? {
                        name: hubForm.managerName,
                        email: hubForm.managerEmail,
                        phone: hubForm.managerPhone,
                        password: hubForm.managerPassword,
                    } : null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAddHubOpen(false);
                setHubForm({ name: '', code: '', city: '', state: '', address: '', contactPhone: '', pincodes: '', capacity: '500', managerName: '', managerEmail: '', managerPhone: '', managerPassword: '' });
                await loadHubs();
            } else {
                alert(data.error || 'Failed to create hub');
            }
        } catch (error) {
            console.error('Failed to create hub:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredHubs = hubs.filter(hub =>
        hub.name.toLowerCase().includes(search.toLowerCase()) ||
        hub.city.toLowerCase().includes(search.toLowerCase()) ||
        hub.manager?.name.toLowerCase().includes(search.toLowerCase())
    );

    const getCapacityColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-amber-500';
        return 'bg-green-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FiServer className="w-7 h-7 text-purple-400" />
                        Hub Management
                    </h1>
                    <p className="text-gray-400 mt-1">Monitor hub storage capacity and inventory across all locations</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAddHubOpen(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 
                                   hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        <FiPlus className="w-4 h-4" /> New Hub
                    </button>
                    <button
                        onClick={loadHubs}
                        className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 
                                   text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Total Hubs</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary?.totalHubs || 0}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Total Stock</p>
                    <p className="text-3xl font-bold text-white mt-1">
                        {summary?.totalStock || 0} <span className="text-lg font-normal text-gray-400">tons</span>
                    </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Avg Capacity</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary?.avgCapacity || 0}%</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">High Capacity</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">
                        {summary?.highCapacityHubs || 0} <span className="text-lg font-normal text-gray-400">hubs</span>
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search hubs by name, location, or manager..."
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               text-white placeholder-gray-500 focus:border-purple-500 
                               focus:ring-1 focus:ring-purple-500 outline-none"
                />
            </div>

            {/* Hub Cards Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
                            <div className="h-6 bg-white/10 rounded w-2/3 mb-4" />
                            <div className="h-4 bg-white/10 rounded w-1/2 mb-6" />
                            <div className="h-3 bg-white/10 rounded mb-2" />
                            <div className="h-8 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredHubs.length === 0 ? (
                <div className="text-center py-12">
                    <FiServer className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No hubs found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHubs.map((hub) => (
                        <div
                            key={hub._id}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 
                                       hover:bg-white/10 transition-all duration-300"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{hub.name}</h3>
                                    <div className="flex items-center gap-1.5 text-gray-400 text-sm mt-1">
                                        <FiMapPin className="w-4 h-4" />
                                        {hub.city}, {hub.state}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${hub.isActive
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {hub.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Stock & Capacity */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-400">Current Stock</span>
                                    <span className="text-white font-medium">
                                        {hub.currentStock} / {hub.capacity} tons
                                    </span>
                                </div>
                                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getCapacityColor(hub.capacityPercent)} transition-all duration-500`}
                                        style={{ width: `${hub.capacityPercent}%` }}
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className={`text-sm font-medium ${hub.capacityPercent >= 90 ? 'text-red-400' :
                                        hub.capacityPercent >= 70 ? 'text-amber-400' : 'text-green-400'
                                        }`}>
                                        {hub.capacityPercent}%
                                    </span>
                                </div>
                            </div>

                            {/* Quality Distribution */}
                            <div className="mb-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Quality Distribution</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-green-400">
                                        Good: {hub.qualityGood}t
                                    </span>
                                    <span className="text-amber-400">
                                        High Moisture: {hub.qualityHighMoisture}t
                                    </span>
                                </div>
                            </div>

                            {/* Manager */}
                            <div className="flex items-center gap-3 py-3 border-t border-white/10">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-xs font-semibold">
                                        {hub.manager?.name?.substring(0, 2).toUpperCase() || 'NA'}
                                    </span>
                                </div>
                                <span className="text-gray-300 text-sm">
                                    {hub.manager?.name || 'No manager assigned'}
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4">
                                <Link
                                    href={`/admin/hubs/${hub._id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 
                                               bg-white/5 hover:bg-white/10 border border-white/10 
                                               text-gray-300 text-sm font-medium rounded-xl transition-colors"
                                >
                                    <FiEye className="w-4 h-4" />
                                    View Details
                                </Link>
                                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 
                                                   bg-gradient-to-r from-purple-600 to-indigo-600 
                                                   hover:from-purple-500 hover:to-indigo-500
                                                   text-white text-sm font-medium rounded-xl transition-all">
                                    <FiPlus className="w-4 h-4" />
                                    Add Entry
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Hub Modal */}
            {addHubOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-2xl p-6 border border-white/10 my-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Create New Hub</h3>
                            <button onClick={() => setAddHubOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Hub Details */}
                            <div>
                                <h4 className="text-sm font-medium text-purple-400 mb-3">Hub Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={hubForm.name} onChange={e => setHubForm({ ...hubForm, name: e.target.value })}
                                        placeholder="Hub Name *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.code} onChange={e => setHubForm({ ...hubForm, code: e.target.value })}
                                        placeholder="Hub Code (e.g. MOH) *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none uppercase" />
                                    <input value={hubForm.city} onChange={e => setHubForm({ ...hubForm, city: e.target.value })}
                                        placeholder="City *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.state} onChange={e => setHubForm({ ...hubForm, state: e.target.value })}
                                        placeholder="State *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.address} onChange={e => setHubForm({ ...hubForm, address: e.target.value })}
                                        placeholder="Address" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.contactPhone} onChange={e => setHubForm({ ...hubForm, contactPhone: e.target.value })}
                                        placeholder="Contact Phone" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.capacity} onChange={e => setHubForm({ ...hubForm, capacity: e.target.value })}
                                        placeholder="Capacity (tons)" type="number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.pincodes} onChange={e => setHubForm({ ...hubForm, pincodes: e.target.value })}
                                        placeholder="Service Pincodes (comma-separated)" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                </div>
                            </div>

                            {/* Manager Details */}
                            <div>
                                <h4 className="text-sm font-medium text-green-400 mb-3">Hub Manager (Optional)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={hubForm.managerName} onChange={e => setHubForm({ ...hubForm, managerName: e.target.value })}
                                        placeholder="Manager Name" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.managerEmail} onChange={e => setHubForm({ ...hubForm, managerEmail: e.target.value })}
                                        placeholder="Manager Email" type="email" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.managerPhone} onChange={e => setHubForm({ ...hubForm, managerPhone: e.target.value })}
                                        placeholder="Manager Phone" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                    <input value={hubForm.managerPassword} onChange={e => setHubForm({ ...hubForm, managerPassword: e.target.value })}
                                        placeholder="Manager Password" type="password" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setAddHubOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleCreateHub} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-medium">
                                {saving ? 'Creating...' : 'Create Hub'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

