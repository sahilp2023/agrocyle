'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    FiArrowLeft, FiEdit2, FiMapPin, FiPhone, FiMail, FiUser, FiUsers,
    FiTruck, FiPackage, FiDollarSign, FiTrendingUp, FiPlus, FiTrash2, FiSave, FiX
} from 'react-icons/fi';

interface Hub {
    _id: string;
    name: string;
    code: string;
    city: string;
    state: string;
    address?: string;
    contactPhone?: string;
    servicePincodes: string[];
    capacity: number;
    isActive: boolean;
}

interface Manager {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    lastLogin?: string;
}

interface Staff {
    _id: string;
    name: string;
    phone: string;
    role: string;
}

interface Analytics {
    inboundThisMonth: number;
    outboundThisMonth: number;
    netChange: number;
    currentStock: number;
    revenueThisMonth: number;
    totalRevenue: number;
    linkedFarmersCount: number;
    totalPickups: number;
}

interface FleetStats {
    balers: number;
    trucks: number;
    available: number;
    busy: number;
}

const roleLabels: Record<string, string> = {
    quality_inspector: '🔍 Quality Inspector',
    operator: '⚙️ Operator',
    driver: '🚗 Driver',
    supervisor: '👔 Supervisor',
};

export default function HubDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [hub, setHub] = useState<Hub | null>(null);
    const [manager, setManager] = useState<Manager | null>(null);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [fleetStats, setFleetStats] = useState<FleetStats | null>(null);
    const [loading, setLoading] = useState(true);

    // Modals
    const [editHubOpen, setEditHubOpen] = useState(false);
    const [editManagerOpen, setEditManagerOpen] = useState(false);
    const [addStaffOpen, setAddStaffOpen] = useState(false);

    // Forms
    const [hubForm, setHubForm] = useState({ name: '', city: '', state: '', address: '', contactPhone: '', pincodes: '' });
    const [managerForm, setManagerForm] = useState({ name: '', email: '', phone: '', password: '' });
    const [staffForm, setStaffForm] = useState({ name: '', phone: '', role: 'operator' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadHubDetails();
    }, [id]);

    const loadHubDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/hubs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setHub(data.data.hub);
                setManager(data.data.manager);
                setStaff(data.data.staff || []);
                setAnalytics(data.data.analytics);
                setFleetStats(data.data.fleetStats);
                // Populate forms
                if (data.data.hub) {
                    setHubForm({
                        name: data.data.hub.name,
                        city: data.data.hub.city,
                        state: data.data.hub.state,
                        address: data.data.hub.address || '',
                        contactPhone: data.data.hub.contactPhone || '',
                        pincodes: data.data.hub.servicePincodes?.join(', ') || '',
                    });
                }
                if (data.data.manager) {
                    setManagerForm({
                        name: data.data.manager.name,
                        email: data.data.manager.email,
                        phone: data.data.manager.phone || '',
                        password: '',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load hub:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHub = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/hubs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: hubForm.name,
                    city: hubForm.city,
                    state: hubForm.state,
                    address: hubForm.address,
                    contactPhone: hubForm.contactPhone,
                    servicePincodes: hubForm.pincodes.split(',').map(p => p.trim()).filter(Boolean),
                }),
            });
            if ((await res.json()).success) {
                setEditHubOpen(false);
                await loadHubDetails();
            }
        } catch (error) {
            console.error('Failed to update hub:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveManager = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const method = manager ? 'PATCH' : 'POST';
            const res = await fetch(`/api/admin/hubs/${id}/manager`, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(managerForm),
            });
            if ((await res.json()).success) {
                setEditManagerOpen(false);
                await loadHubDetails();
            }
        } catch (error) {
            console.error('Failed to update manager:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddStaff = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/hubs/${id}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(staffForm),
            });
            if ((await res.json()).success) {
                setAddStaffOpen(false);
                setStaffForm({ name: '', phone: '', role: 'operator' });
                await loadHubDetails();
            }
        } catch (error) {
            console.error('Failed to add staff:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm('Remove this staff member?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/admin/hubs/${id}/staff`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ staffId }),
            });
            await loadHubDetails();
        } catch (error) {
            console.error('Failed to remove staff:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin text-4xl">🏢</div>
            </div>
        );
    }

    if (!hub) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Hub not found</p>
                <Link href="/admin/hubs" className="text-purple-400 hover:underline mt-4 inline-block">
                    ← Back to Hub Management
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/hubs" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <FiArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">{hub.name}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${hub.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                            }`}>
                            {hub.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">{hub.code} • {hub.city}, {hub.state}</p>
                </div>
                <button
                    onClick={() => setEditHubOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg"
                >
                    <FiEdit2 className="w-4 h-4" /> Edit Hub
                </button>
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20 rounded-xl p-5">
                    <FiTrendingUp className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{analytics?.inboundThisMonth?.toFixed(1) || 0} T</p>
                    <p className="text-green-400 text-sm">Inbound (This Month)</p>
                </div>
                <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/20 rounded-xl p-5">
                    <FiPackage className="w-6 h-6 text-red-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{analytics?.outboundThisMonth?.toFixed(1) || 0} T</p>
                    <p className="text-red-400 text-sm">Outbound (This Month)</p>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-xl p-5">
                    <FiDollarSign className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.revenueThisMonth || 0)}</p>
                    <p className="text-blue-400 text-sm">Revenue (This Month)</p>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-xl p-5">
                    <FiUsers className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{analytics?.linkedFarmersCount || 0}</p>
                    <p className="text-purple-400 text-sm">Linked Farmers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hub Manager */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <FiUser className="w-5 h-5 text-purple-400" /> Hub Manager
                        </h2>
                        <button
                            onClick={() => setEditManagerOpen(true)}
                            className="text-sm text-purple-400 hover:text-purple-300"
                        >
                            {manager ? 'Edit' : 'Assign Manager'}
                        </button>
                    </div>
                    {manager ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold">{manager.name.charAt(0)}</span>
                                </div>
                                <div>
                                    <p className="text-white font-medium">{manager.name}</p>
                                    <p className="text-gray-400 text-sm flex items-center gap-1">
                                        <FiMail className="w-3 h-3" /> {manager.email}
                                    </p>
                                </div>
                            </div>
                            {manager.phone && (
                                <p className="text-gray-400 text-sm flex items-center gap-2">
                                    <FiPhone className="w-4 h-4" /> {manager.phone}
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">No manager assigned</p>
                    )}
                </div>

                {/* Fleet Strength */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                        <FiTruck className="w-5 h-5 text-amber-400" /> Fleet Strength
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white">{fleetStats?.balers || 0}</p>
                            <p className="text-gray-400 text-sm">🚜 Balers</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-white">{fleetStats?.trucks || 0}</p>
                            <p className="text-gray-400 text-sm">🚛 Trucks</p>
                        </div>
                        <div className="bg-green-500/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-green-400">{fleetStats?.available || 0}</p>
                            <p className="text-gray-400 text-sm">Available</p>
                        </div>
                        <div className="bg-amber-500/10 rounded-xl p-4 text-center">
                            <p className="text-2xl font-bold text-amber-400">{fleetStats?.busy || 0}</p>
                            <p className="text-gray-400 text-sm">Busy</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Staff Management */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FiUsers className="w-5 h-5 text-green-400" /> Staff ({staff.length})
                    </h2>
                    <button
                        onClick={() => setAddStaffOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg"
                    >
                        <FiPlus className="w-4 h-4" /> Add Staff
                    </button>
                </div>
                {staff.length === 0 ? (
                    <p className="text-gray-500">No staff members added</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {staff.map((s) => (
                            <div key={s._id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                                <div>
                                    <p className="text-white font-medium">{s.name}</p>
                                    <p className="text-gray-400 text-sm">{roleLabels[s.role] || s.role}</p>
                                    <p className="text-gray-500 text-xs">{s.phone}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveStaff(s._id)}
                                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Service Pincodes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                    <FiMapPin className="w-5 h-5 text-blue-400" /> Service Pincodes
                </h2>
                <div className="flex flex-wrap gap-2">
                    {hub.servicePincodes?.length > 0 ? (
                        hub.servicePincodes.map((pin, i) => (
                            <span key={i} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                                {pin}
                            </span>
                        ))
                    ) : (
                        <p className="text-gray-500">No pincodes configured</p>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{analytics?.currentStock?.toFixed(1) || 0} T</p>
                        <p className="text-gray-400 text-sm">Current Stock</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{analytics?.totalPickups || 0}</p>
                        <p className="text-gray-400 text-sm">Total Pickups</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                        <p className="text-gray-400 text-sm">Total Revenue</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white">{hub.capacity} T</p>
                        <p className="text-gray-400 text-sm">Capacity</p>
                    </div>
                </div>
            </div>

            {/* Edit Hub Modal */}
            {editHubOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Edit Hub</h3>
                            <button onClick={() => setEditHubOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input value={hubForm.name} onChange={e => setHubForm({ ...hubForm, name: e.target.value })}
                                placeholder="Hub Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <input value={hubForm.city} onChange={e => setHubForm({ ...hubForm, city: e.target.value })}
                                    placeholder="City" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                                <input value={hubForm.state} onChange={e => setHubForm({ ...hubForm, state: e.target.value })}
                                    placeholder="State" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            </div>
                            <input value={hubForm.address} onChange={e => setHubForm({ ...hubForm, address: e.target.value })}
                                placeholder="Address" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <input value={hubForm.contactPhone} onChange={e => setHubForm({ ...hubForm, contactPhone: e.target.value })}
                                placeholder="Contact Phone" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <input value={hubForm.pincodes} onChange={e => setHubForm({ ...hubForm, pincodes: e.target.value })}
                                placeholder="Pincodes (comma-separated)" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditHubOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleSaveHub} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl flex items-center justify-center gap-2">
                                <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Manager Modal */}
            {editManagerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{manager ? 'Edit Manager' : 'Assign Manager'}</h3>
                            <button onClick={() => setEditManagerOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input value={managerForm.name} onChange={e => setManagerForm({ ...managerForm, name: e.target.value })}
                                placeholder="Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <input value={managerForm.email} onChange={e => setManagerForm({ ...managerForm, email: e.target.value })}
                                placeholder="Email" type="email" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <input value={managerForm.phone} onChange={e => setManagerForm({ ...managerForm, phone: e.target.value })}
                                placeholder="Phone" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <input value={managerForm.password} onChange={e => setManagerForm({ ...managerForm, password: e.target.value })}
                                placeholder={manager ? "New Password (leave blank to keep)" : "Password"} type="password" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditManagerOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleSaveManager} disabled={saving} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            {addStaffOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Add Staff</h3>
                            <button onClick={() => setAddStaffOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                                placeholder="Name" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <input value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                                placeholder="Phone" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 outline-none" />
                            <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 outline-none">
                                <option value="operator">Operator</option>
                                <option value="driver">Driver</option>
                                <option value="quality_inspector">Quality Inspector</option>
                                <option value="supervisor">Supervisor</option>
                            </select>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setAddStaffOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleAddStaff} disabled={saving} className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl">
                                {saving ? 'Adding...' : 'Add Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
