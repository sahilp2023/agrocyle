'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FiBriefcase, FiSearch, FiRefreshCw, FiMapPin, FiEye, FiPlus,
    FiX, FiCalendar, FiDollarSign, FiPackage, FiAlertTriangle
} from 'react-icons/fi';

interface Buyer {
    _id: string;
    companyName: string;
    companyCode: string;
    contactPerson: string;
    plantCity: string;
    plantState: string;
    agreementEndDate: string;
    pricePerTonne: number;
    isActive: boolean;
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    totalDelivered: number;
    daysToExpiry: number;
    isExpiringSoon: boolean;
    isExpired: boolean;
}

interface Summary {
    totalBuyers: number;
    activeBuyers: number;
    totalRevenue: number;
    pendingOrders: number;
}

export default function AdminBuyersPage() {
    const [buyers, setBuyers] = useState<Buyer[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [addBuyerOpen, setAddBuyerOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hubs, setHubs] = useState<{ _id: string; name: string }[]>([]);

    // New Buyer Form
    const [form, setForm] = useState({
        companyName: '', companyCode: '', contactPerson: '', email: '', phone: '',
        gstNumber: '', panNumber: '', plantAddress: '', plantCity: '', plantState: '', plantPincode: '',
        agreementStartDate: '', agreementEndDate: '', pricePerTonne: '', minimumOrderTonnes: '10',
        paymentTermsDays: '30', assignedHubs: [] as string[],
    });

    useEffect(() => {
        loadBuyers();
        loadHubs();
    }, []);

    const loadBuyers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/buyers', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setBuyers(data.data.buyers || []);
                setSummary(data.data.summary);
            }
        } catch (error) {
            console.error('Failed to load buyers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadHubs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/hubs', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setHubs(data.data.hubs || []);
            }
        } catch (error) {
            console.error('Failed to load hubs:', error);
        }
    };

    const handleCreateBuyer = async () => {
        if (!form.companyName || !form.companyCode || !form.contactPerson || !form.email || !form.phone) {
            alert('Please fill all required fields');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/buyers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    ...form,
                    pricePerTonne: parseFloat(form.pricePerTonne) || 0,
                    minimumOrderTonnes: parseInt(form.minimumOrderTonnes) || 10,
                    paymentTermsDays: parseInt(form.paymentTermsDays) || 30,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setAddBuyerOpen(false);
                setForm({
                    companyName: '', companyCode: '', contactPerson: '', email: '', phone: '',
                    gstNumber: '', panNumber: '', plantAddress: '', plantCity: '', plantState: '', plantPincode: '',
                    agreementStartDate: '', agreementEndDate: '', pricePerTonne: '', minimumOrderTonnes: '10',
                    paymentTermsDays: '30', assignedHubs: [],
                });
                await loadBuyers();
            } else {
                alert(data.error || 'Failed to create buyer');
            }
        } catch (error) {
            console.error('Failed to create buyer:', error);
        } finally {
            setSaving(false);
        }
    };

    const filteredBuyers = buyers.filter(b =>
        b.companyName.toLowerCase().includes(search.toLowerCase()) ||
        b.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
        b.plantCity.toLowerCase().includes(search.toLowerCase())
    );

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
                        <FiBriefcase className="w-7 h-7 text-emerald-400" />
                        Buyers
                    </h1>
                    <p className="text-gray-400 mt-1">Manage B2B buyers with bilateral agreements</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setAddBuyerOpen(true)}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 
                                   hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-2 rounded-lg font-medium"
                    >
                        <FiPlus className="w-4 h-4" /> New Buyer
                    </button>
                    <button
                        onClick={loadBuyers}
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
                    <p className="text-gray-400 text-sm">Total Buyers</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary?.totalBuyers || 0}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Active Agreements</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">{summary?.activeBuyers || 0}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold text-emerald-400 mt-1">{formatCurrency(summary?.totalRevenue || 0)}</p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5">
                    <p className="text-gray-400 text-sm">Pending Orders</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">{summary?.pendingOrders || 0}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search buyers by company, contact, or location..."
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl
                               text-white placeholder-gray-500 focus:border-emerald-500 
                               focus:ring-1 focus:ring-emerald-500 outline-none"
                />
            </div>

            {/* Buyer Cards */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-6 animate-pulse">
                            <div className="h-6 bg-white/10 rounded w-2/3 mb-4" />
                            <div className="h-4 bg-white/10 rounded w-1/2 mb-6" />
                            <div className="h-8 bg-white/10 rounded" />
                        </div>
                    ))}
                </div>
            ) : filteredBuyers.length === 0 ? (
                <div className="text-center py-12">
                    <FiBriefcase className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No buyers found</p>
                    <button onClick={() => setAddBuyerOpen(true)} className="mt-4 text-emerald-400 hover:underline">
                        Add your first buyer
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBuyers.map((buyer) => (
                        <div
                            key={buyer._id}
                            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 
                                       hover:bg-white/10 transition-all duration-300"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{buyer.companyName}</h3>
                                    <p className="text-emerald-400 text-sm font-medium">{buyer.companyCode}</p>
                                    <p className="text-gray-400 text-sm">{buyer.contactPerson}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${buyer.isExpired ? 'bg-red-500/20 text-red-400' :
                                        buyer.isExpiringSoon ? 'bg-amber-500/20 text-amber-400' :
                                            buyer.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                                    }`}>
                                    {buyer.isExpired ? 'Expired' : buyer.isExpiringSoon ? 'Expiring Soon' : buyer.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                                <FiMapPin className="w-4 h-4" />
                                {buyer.plantCity}, {buyer.plantState}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="text-center bg-white/5 rounded-lg p-2">
                                    <p className="text-lg font-bold text-white">{buyer.totalOrders}</p>
                                    <p className="text-xs text-gray-500">Orders</p>
                                </div>
                                <div className="text-center bg-white/5 rounded-lg p-2">
                                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(buyer.totalRevenue)}</p>
                                    <p className="text-xs text-gray-500">Revenue</p>
                                </div>
                                <div className="text-center bg-white/5 rounded-lg p-2">
                                    <p className="text-lg font-bold text-amber-400">{buyer.pendingOrders}</p>
                                    <p className="text-xs text-gray-500">Pending</p>
                                </div>
                            </div>

                            {/* Agreement Info */}
                            <div className="flex items-center gap-2 text-sm mb-4">
                                <FiCalendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-400">
                                    {buyer.isExpired ? 'Expired' : `${buyer.daysToExpiry} days left`}
                                </span>
                                <span className="text-gray-600">•</span>
                                <FiDollarSign className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-400">₹{buyer.pricePerTonne}/T</span>
                            </div>

                            {/* Warning */}
                            {(buyer.isExpired || buyer.isExpiringSoon) && (
                                <div className={`flex items-center gap-2 text-sm p-2 rounded-lg mb-4 ${buyer.isExpired ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                                    }`}>
                                    <FiAlertTriangle className="w-4 h-4" />
                                    {buyer.isExpired ? 'Agreement expired - Renewal required' : 'Agreement expiring soon'}
                                </div>
                            )}

                            {/* Actions */}
                            <Link
                                href={`/admin/buyers/${buyer._id}`}
                                className="flex items-center justify-center gap-2 w-full py-2.5 
                                           bg-gradient-to-r from-emerald-600 to-teal-600
                                           hover:from-emerald-500 hover:to-teal-500
                                           text-white text-sm font-medium rounded-xl transition-all"
                            >
                                <FiEye className="w-4 h-4" />
                                View Details
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Buyer Modal */}
            {addBuyerOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-3xl p-6 border border-white/10 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-white">Add New Buyer</h3>
                            <button onClick={() => setAddBuyerOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Company Details */}
                            <div>
                                <h4 className="text-sm font-medium text-emerald-400 mb-3">Company Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                                        placeholder="Company Name *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.companyCode} onChange={e => setForm({ ...form, companyCode: e.target.value })}
                                        placeholder="Company Code (e.g. RELI) *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none uppercase" />
                                    <input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })}
                                        placeholder="Contact Person *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                                        placeholder="Email *" type="email" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="Phone *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                                        placeholder="GST Number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.panNumber} onChange={e => setForm({ ...form, panNumber: e.target.value })}
                                        placeholder="PAN Number" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none uppercase" />
                                </div>
                            </div>

                            {/* Plant Location */}
                            <div>
                                <h4 className="text-sm font-medium text-blue-400 mb-3">Plant Location</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={form.plantAddress} onChange={e => setForm({ ...form, plantAddress: e.target.value })}
                                        placeholder="Plant Address *" className="col-span-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.plantCity} onChange={e => setForm({ ...form, plantCity: e.target.value })}
                                        placeholder="City *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.plantState} onChange={e => setForm({ ...form, plantState: e.target.value })}
                                        placeholder="State *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.plantPincode} onChange={e => setForm({ ...form, plantPincode: e.target.value })}
                                        placeholder="Pincode *" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                </div>
                            </div>

                            {/* Agreement Terms */}
                            <div>
                                <h4 className="text-sm font-medium text-amber-400 mb-3">Agreement Terms</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Start Date *</label>
                                        <input value={form.agreementStartDate} onChange={e => setForm({ ...form, agreementStartDate: e.target.value })}
                                            type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">End Date *</label>
                                        <input value={form.agreementEndDate} onChange={e => setForm({ ...form, agreementEndDate: e.target.value })}
                                            type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none" />
                                    </div>
                                    <input value={form.pricePerTonne} onChange={e => setForm({ ...form, pricePerTonne: e.target.value })}
                                        placeholder="Price per Tonne (₹) *" type="number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.minimumOrderTonnes} onChange={e => setForm({ ...form, minimumOrderTonnes: e.target.value })}
                                        placeholder="Min Order (tonnes)" type="number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                    <input value={form.paymentTermsDays} onChange={e => setForm({ ...form, paymentTermsDays: e.target.value })}
                                        placeholder="Payment Terms (days)" type="number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                </div>
                            </div>

                            {/* Assigned Hubs */}
                            <div>
                                <h4 className="text-sm font-medium text-purple-400 mb-3">Assigned Hubs (Optional)</h4>
                                <div className="flex flex-wrap gap-2">
                                    {hubs.map(hub => (
                                        <label key={hub._id} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10">
                                            <input
                                                type="checkbox"
                                                checked={form.assignedHubs.includes(hub._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setForm({ ...form, assignedHubs: [...form.assignedHubs, hub._id] });
                                                    } else {
                                                        setForm({ ...form, assignedHubs: form.assignedHubs.filter(id => id !== hub._id) });
                                                    }
                                                }}
                                                className="rounded text-emerald-500"
                                            />
                                            <span className="text-white text-sm">{hub.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setAddBuyerOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleCreateBuyer} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-medium">
                                {saving ? 'Creating...' : 'Create Buyer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
