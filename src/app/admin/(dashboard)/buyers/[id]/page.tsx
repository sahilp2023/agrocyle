'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    FiArrowLeft, FiEdit2, FiMapPin, FiPhone, FiMail, FiUser, FiCalendar,
    FiDollarSign, FiPackage, FiFileText, FiTruck, FiPlus, FiX, FiCheck,
    FiAlertTriangle, FiDownload, FiTrash2
} from 'react-icons/fi';

interface Buyer {
    _id: string;
    companyName: string;
    companyCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    gstNumber?: string;
    panNumber?: string;
    plantAddress: string;
    plantCity: string;
    plantState: string;
    plantPincode: string;
    assignedHubs: string[];
    agreementStartDate: string;
    agreementEndDate: string;
    pricePerTonne: number;
    minimumOrderTonnes: number;
    paymentTermsDays: number;
    isActive: boolean;
}

interface Order {
    _id: string;
    orderNumber: string;
    hubId: { _id: string; name: string };
    quantityTonnes: number;
    pricePerTonne: number;
    totalAmount: number;
    status: string;
    requestedDate: string;
    paymentStatus: string;
    paidAmount: number;
}

interface Contract {
    _id: string;
    title: string;
    type: string;
    fileUrl: string;
    validFrom: string;
    validUntil?: string;
}

interface AssignedHub {
    _id: string;
    name: string;
    city: string;
    state: string;
}

interface Analytics {
    totalOrders: number;
    totalRevenue: number;
    totalDelivered: number;
    paidAmount: number;
    pendingPayment: number;
}

const statusColors: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400',
    confirmed: 'bg-blue-500/20 text-blue-400',
    dispatched: 'bg-purple-500/20 text-purple-400',
    delivered: 'bg-green-500/20 text-green-400',
    cancelled: 'bg-red-500/20 text-red-400',
};

const contractTypeLabels: Record<string, string> = {
    agreement: '📜 Agreement',
    amendment: '📝 Amendment',
    nda: '🔒 NDA',
    invoice: '💰 Invoice',
    other: '📄 Other',
};

export default function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [buyer, setBuyer] = useState<Buyer | null>(null);
    const [assignedHubs, setAssignedHubs] = useState<AssignedHub[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [allHubs, setAllHubs] = useState<{ _id: string; name: string }[]>([]);

    // Modals
    const [addContractOpen, setAddContractOpen] = useState(false);
    const [addOrderOpen, setAddOrderOpen] = useState(false);

    // Forms
    const [contractForm, setContractForm] = useState({ title: '', type: 'agreement', fileUrl: '', validFrom: '', validUntil: '', notes: '' });
    const [orderForm, setOrderForm] = useState({ hubId: '', quantityTonnes: '', pricePerTonne: '', requestedDate: '', notes: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBuyerDetails();
        loadAllHubs();
    }, [id]);

    const loadBuyerDetails = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/buyers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setBuyer(data.data.buyer);
                setAssignedHubs(data.data.assignedHubs || []);
                setContracts(data.data.contracts || []);
                setAnalytics(data.data.analytics);
                setPendingOrders(data.data.pendingOrders || []);
                setRecentOrders(data.data.recentOrders || []);
                if (data.data.buyer) {
                    setOrderForm(f => ({ ...f, pricePerTonne: String(data.data.buyer.pricePerTonne) }));
                }
            }
        } catch (error) {
            console.error('Failed to load buyer:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAllHubs = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch('/api/admin/hubs', { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setAllHubs(data.data.hubs || []);
        } catch (error) {
            console.error('Failed to load hubs:', error);
        }
    };

    const handleAddContract = async () => {
        if (!contractForm.title || !contractForm.fileUrl || !contractForm.validFrom) {
            alert('Title, file URL, and valid from date are required');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/buyers/${id}/contracts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(contractForm),
            });
            if ((await res.json()).success) {
                setAddContractOpen(false);
                setContractForm({ title: '', type: 'agreement', fileUrl: '', validFrom: '', validUntil: '', notes: '' });
                await loadBuyerDetails();
            }
        } catch (error) {
            console.error('Failed to add contract:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddOrder = async () => {
        if (!orderForm.hubId || !orderForm.quantityTonnes || !orderForm.pricePerTonne || !orderForm.requestedDate) {
            alert('All fields are required');
            return;
        }
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/buyers/${id}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    hubId: orderForm.hubId,
                    quantityTonnes: parseFloat(orderForm.quantityTonnes),
                    pricePerTonne: parseFloat(orderForm.pricePerTonne),
                    requestedDate: orderForm.requestedDate,
                    notes: orderForm.notes,
                }),
            });
            if ((await res.json()).success) {
                setAddOrderOpen(false);
                setOrderForm({ hubId: '', quantityTonnes: '', pricePerTonne: String(buyer?.pricePerTonne || ''), requestedDate: '', notes: '' });
                await loadBuyerDetails();
            }
        } catch (error) {
            console.error('Failed to add order:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, status: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/admin/buyers/${id}/orders`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ orderId, status }),
            });
            await loadBuyerDetails();
        } catch (error) {
            console.error('Failed to update order:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const daysToExpiry = buyer ? Math.ceil((new Date(buyer.agreementEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin text-4xl">🏢</div>
            </div>
        );
    }

    if (!buyer) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Buyer not found</p>
                <Link href="/admin/buyers" className="text-emerald-400 hover:underline mt-4 inline-block">
                    ← Back to Buyers
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/buyers" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <FiArrowLeft className="w-5 h-5 text-gray-400" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">{buyer.companyName}</h1>
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-medium">
                            {buyer.companyCode}
                        </span>
                        {daysToExpiry <= 0 && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-1">
                                <FiAlertTriangle className="w-3 h-3" /> Expired
                            </span>
                        )}
                    </div>
                    <p className="text-gray-400 text-sm">{buyer.contactPerson} • {buyer.plantCity}, {buyer.plantState}</p>
                </div>
            </div>

            {/* Analytics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/20 rounded-xl p-5">
                    <FiPackage className="w-6 h-6 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{analytics?.totalOrders || 0}</p>
                    <p className="text-blue-400 text-sm">Total Orders</p>
                </div>
                <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/20 rounded-xl p-5">
                    <FiTruck className="w-6 h-6 text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{analytics?.totalDelivered?.toFixed(1) || 0} T</p>
                    <p className="text-green-400 text-sm">Delivered</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 rounded-xl p-5">
                    <FiDollarSign className="w-6 h-6 text-emerald-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.totalRevenue || 0)}</p>
                    <p className="text-emerald-400 text-sm">Total Revenue</p>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 rounded-xl p-5">
                    <FiCheck className="w-6 h-6 text-purple-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.paidAmount || 0)}</p>
                    <p className="text-purple-400 text-sm">Paid</p>
                </div>
                <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 border border-amber-500/20 rounded-xl p-5">
                    <FiAlertTriangle className="w-6 h-6 text-amber-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{formatCurrency(analytics?.pendingPayment || 0)}</p>
                    <p className="text-amber-400 text-sm">Pending</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-emerald-400" /> Company Details
                    </h2>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                            <FiMail className="w-4 h-4 text-gray-500" /> {buyer.email}
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                            <FiPhone className="w-4 h-4 text-gray-500" /> {buyer.phone}
                        </div>
                        <div className="flex items-start gap-2 text-gray-300">
                            <FiMapPin className="w-4 h-4 text-gray-500 mt-1" />
                            <span>{buyer.plantAddress}, {buyer.plantCity}, {buyer.plantState} - {buyer.plantPincode}</span>
                        </div>
                        {buyer.gstNumber && <p className="text-gray-400">GST: <span className="text-white">{buyer.gstNumber}</span></p>}
                        {buyer.panNumber && <p className="text-gray-400">PAN: <span className="text-white">{buyer.panNumber}</span></p>}
                    </div>
                </div>

                {/* Agreement Terms */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <FiCalendar className="w-5 h-5 text-amber-400" /> Agreement Terms
                    </h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-500">Start Date</p>
                            <p className="text-white font-medium">{formatDate(buyer.agreementStartDate)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">End Date</p>
                            <p className={`font-medium ${daysToExpiry <= 0 ? 'text-red-400' : daysToExpiry <= 30 ? 'text-amber-400' : 'text-white'}`}>
                                {formatDate(buyer.agreementEndDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500">Price per Tonne</p>
                            <p className="text-emerald-400 font-bold text-lg">₹{buyer.pricePerTonne}</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Payment Terms</p>
                            <p className="text-white font-medium">{buyer.paymentTermsDays} days</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Min Order</p>
                            <p className="text-white font-medium">{buyer.minimumOrderTonnes} tonnes</p>
                        </div>
                        <div>
                            <p className="text-gray-500">Days Remaining</p>
                            <p className={`font-bold ${daysToExpiry <= 0 ? 'text-red-400' : daysToExpiry <= 30 ? 'text-amber-400' : 'text-green-400'}`}>
                                {daysToExpiry <= 0 ? 'Expired' : `${daysToExpiry} days`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contracts */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FiFileText className="w-5 h-5 text-blue-400" /> Contracts & Documents
                    </h2>
                    <button
                        onClick={() => setAddContractOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg"
                    >
                        <FiPlus className="w-4 h-4" /> Add Document
                    </button>
                </div>
                {contracts.length === 0 ? (
                    <p className="text-gray-500">No documents uploaded</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contracts.map((c) => (
                            <div key={c._id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                                <div>
                                    <p className="text-white font-medium">{c.title}</p>
                                    <p className="text-gray-400 text-sm">{contractTypeLabels[c.type] || c.type}</p>
                                    <p className="text-gray-500 text-xs">Valid from {formatDate(c.validFrom)}{c.validUntil && ` to ${formatDate(c.validUntil)}`}</p>
                                </div>
                                <a href={c.fileUrl} target="_blank" className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg">
                                    <FiDownload className="w-5 h-5" />
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Orders */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FiPackage className="w-5 h-5 text-amber-400" /> Pending Orders ({pendingOrders.length})
                    </h2>
                    <button
                        onClick={() => setAddOrderOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg"
                    >
                        <FiPlus className="w-4 h-4" /> New Order
                    </button>
                </div>
                {pendingOrders.length === 0 ? (
                    <p className="text-gray-500">No pending orders</p>
                ) : (
                    <div className="space-y-3">
                        {pendingOrders.map((o) => (
                            <div key={o._id} className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                                <div>
                                    <p className="text-white font-medium">{o.orderNumber}</p>
                                    <p className="text-gray-400 text-sm">{o.hubId?.name} • {o.quantityTonnes}T • {formatCurrency(o.totalAmount)}</p>
                                    <p className="text-gray-500 text-xs">Requested: {formatDate(o.requestedDate)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[o.status]}`}>
                                        {o.status}
                                    </span>
                                    {o.status === 'pending' && (
                                        <button onClick={() => handleUpdateOrderStatus(o._id, 'confirmed')} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg">
                                            <FiCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                    {o.status === 'confirmed' && (
                                        <button onClick={() => handleUpdateOrderStatus(o._id, 'dispatched')} className="p-2 text-purple-400 hover:bg-purple-500/10 rounded-lg">
                                            <FiTruck className="w-4 h-4" />
                                        </button>
                                    )}
                                    {o.status === 'dispatched' && (
                                        <button onClick={() => handleUpdateOrderStatus(o._id, 'delivered')} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg">
                                            <FiCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Assigned Hubs */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FiMapPin className="w-5 h-5 text-purple-400" /> Assigned Hubs ({assignedHubs.length})
                </h2>
                {assignedHubs.length === 0 ? (
                    <p className="text-gray-500">No hubs assigned</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {assignedHubs.map((h) => (
                            <div key={h._id} className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm">
                                {h.name} • {h.city}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Contract Modal */}
            {addContractOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Add Document</h3>
                            <button onClick={() => setAddContractOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <input value={contractForm.title} onChange={e => setContractForm({ ...contractForm, title: e.target.value })}
                                placeholder="Document Title *" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 outline-none" />
                            <select value={contractForm.type} onChange={e => setContractForm({ ...contractForm, type: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none">
                                <option value="agreement">Agreement</option>
                                <option value="amendment">Amendment</option>
                                <option value="nda">NDA</option>
                                <option value="invoice">Invoice</option>
                                <option value="other">Other</option>
                            </select>
                            <input value={contractForm.fileUrl} onChange={e => setContractForm({ ...contractForm, fileUrl: e.target.value })}
                                placeholder="File URL *" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 outline-none" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Valid From *</label>
                                    <input value={contractForm.validFrom} onChange={e => setContractForm({ ...contractForm, validFrom: e.target.value })}
                                        type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Valid Until</label>
                                    <input value={contractForm.validUntil} onChange={e => setContractForm({ ...contractForm, validUntil: e.target.value })}
                                        type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <textarea value={contractForm.notes} onChange={e => setContractForm({ ...contractForm, notes: e.target.value })}
                                placeholder="Notes" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 outline-none" rows={2} />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setAddContractOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleAddContract} disabled={saving} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl">
                                {saving ? 'Saving...' : 'Add Document'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Order Modal */}
            {addOrderOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="bg-slate-800 rounded-2xl w-full max-w-lg p-6 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Create Order</h3>
                            <button onClick={() => setAddOrderOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <select value={orderForm.hubId} onChange={e => setOrderForm({ ...orderForm, hubId: e.target.value })}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none">
                                <option value="">Select Hub *</option>
                                {allHubs.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input value={orderForm.quantityTonnes} onChange={e => setOrderForm({ ...orderForm, quantityTonnes: e.target.value })}
                                    placeholder="Quantity (tonnes) *" type="number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                                <input value={orderForm.pricePerTonne} onChange={e => setOrderForm({ ...orderForm, pricePerTonne: e.target.value })}
                                    placeholder="Price/tonne (₹) *" type="number" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1">Requested Date *</label>
                                <input value={orderForm.requestedDate} onChange={e => setOrderForm({ ...orderForm, requestedDate: e.target.value })}
                                    type="date" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500 outline-none" />
                            </div>
                            <textarea value={orderForm.notes} onChange={e => setOrderForm({ ...orderForm, notes: e.target.value })}
                                placeholder="Notes" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-emerald-500 outline-none" rows={2} />
                            {orderForm.quantityTonnes && orderForm.pricePerTonne && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                                    <p className="text-emerald-400 font-medium">Total: ₹{(parseFloat(orderForm.quantityTonnes) * parseFloat(orderForm.pricePerTonne)).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setAddOrderOpen(false)} className="flex-1 py-3 border border-white/10 text-gray-300 rounded-xl hover:bg-white/5">Cancel</button>
                            <button onClick={handleAddOrder} disabled={saving} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                                {saving ? 'Creating...' : 'Create Order'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
