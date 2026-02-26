'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    FiArrowLeft, FiPackage, FiUser, FiTruck, FiCheckCircle,
    FiClipboard, FiSend, FiBox
} from 'react-icons/fi';

interface OrderDetail {
    _id: string;
    orderNumber: string;
    buyerId: {
        _id: string; companyName: string; companyCode: string;
        contactPerson: string; phone: string; email: string;
    };
    hubId: { _id: string; name: string; city: string; code: string };
    quantityTonnes: number;
    pricePerTonne: number;
    totalAmount: number;
    status: string;
    requestedDate: string;
    stockAllocated?: { allocatedQtyTonnes: number; allocatedAt: string };
    qualityReport?: {
        calorificValue?: number; moistureContent?: number; pelletSize?: number;
        bulkDensity?: number; ashContent?: number; silicaInAsh?: number;
        sulfurContent?: number; chlorineContent?: number; torrefied?: boolean;
    };
    shipmentDetails?: {
        shippingDate?: string; trackingId?: string; vehicleNumber?: string;
        driverName?: string; driverPhone?: string; estimatedDelivery?: string;
    };
}

const QUALITY_FIELDS = [
    { key: 'calorificValue', label: 'Calorific Value', unit: 'MJ/kg', placeholder: '15-20' },
    { key: 'moistureContent', label: 'Moisture Content', unit: '%', placeholder: '8-12' },
    { key: 'pelletSize', label: 'Pellet Size', unit: 'mm', placeholder: '6-12' },
    { key: 'bulkDensity', label: 'Bulk Density', unit: 'kg/m³', placeholder: '550-700' },
    { key: 'ashContent', label: 'Ash Content', unit: '%', placeholder: '5-10' },
    { key: 'silicaInAsh', label: 'Silica in Ash', unit: '%', placeholder: '40-60' },
    { key: 'sulfurContent', label: 'Sulfur Content', unit: '%', placeholder: '0.1-0.5' },
    { key: 'chlorineContent', label: 'Chlorine Content', unit: '%', placeholder: '0.05-0.3' },
];

export default function HubOrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dispatching, setDispatching] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [showConfirm, setShowConfirm] = useState(false);

    // Form state
    const [allocatedQty, setAllocatedQty] = useState('');
    const [quality, setQuality] = useState<Record<string, string>>({});
    const [torrefied, setTorrefied] = useState(false);
    const [shipment, setShipment] = useState({
        shippingDate: '', trackingId: '', vehicleNumber: '',
        driverName: '', driverPhone: '', estimatedDelivery: '',
    });

    useEffect(() => { loadOrder(); }, [id]);

    const loadOrder = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch(`/api/hub/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                const o = data.data;
                setOrder(o);
                // Populate form with existing data
                if (o.stockAllocated?.allocatedQtyTonnes) setAllocatedQty(String(o.stockAllocated.allocatedQtyTonnes));
                if (o.qualityReport) {
                    const q: Record<string, string> = {};
                    QUALITY_FIELDS.forEach(f => {
                        const v = o.qualityReport?.[f.key as keyof typeof o.qualityReport];
                        if (v !== undefined && v !== null) q[f.key] = String(v);
                    });
                    setQuality(q);
                    setTorrefied(!!o.qualityReport.torrefied);
                }
                if (o.shipmentDetails) {
                    setShipment({
                        shippingDate: o.shipmentDetails.shippingDate?.split('T')[0] || '',
                        trackingId: o.shipmentDetails.trackingId || '',
                        vehicleNumber: o.shipmentDetails.vehicleNumber || '',
                        driverName: o.shipmentDetails.driverName || '',
                        driverPhone: o.shipmentDetails.driverPhone || '',
                        estimatedDelivery: o.shipmentDetails.estimatedDelivery?.split('T')[0] || '',
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load order:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveProgress = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const token = localStorage.getItem('hubToken');
            const qualityReport: Record<string, unknown> = { torrefied };
            QUALITY_FIELDS.forEach(f => {
                if (quality[f.key]) qualityReport[f.key] = parseFloat(quality[f.key]);
            });

            const body: Record<string, unknown> = {};
            if (allocatedQty) body.stockAllocated = { allocatedQtyTonnes: parseFloat(allocatedQty) };
            body.qualityReport = qualityReport;
            body.shipmentDetails = {
                ...shipment,
                shippingDate: shipment.shippingDate || undefined,
                estimatedDelivery: shipment.estimatedDelivery || undefined,
            };

            const res = await fetch(`/api/hub/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setSaveMsg('✅ Progress saved');
                await loadOrder();
            } else {
                setSaveMsg(`❌ ${data.error || 'Failed'}`);
            }
        } catch {
            setSaveMsg('❌ Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleDispatch = () => {
        setShowConfirm(true);
    };

    const confirmDispatch = async () => {
        setShowConfirm(false);
        setDispatching(true);
        setSaveMsg('');
        try {
            const token = localStorage.getItem('hubToken');
            const qualityReport: Record<string, unknown> = { torrefied };
            QUALITY_FIELDS.forEach(f => {
                if (quality[f.key]) qualityReport[f.key] = parseFloat(quality[f.key]);
            });

            const body = {
                action: 'dispatch',
                stockAllocated: allocatedQty ? { allocatedQtyTonnes: parseFloat(allocatedQty) } : undefined,
                qualityReport,
                shipmentDetails: {
                    ...shipment,
                    shippingDate: shipment.shippingDate || new Date().toISOString().split('T')[0],
                    estimatedDelivery: shipment.estimatedDelivery || undefined,
                },
            };

            const res = await fetch(`/api/hub/orders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setSaveMsg('✅ Order dispatched!');
                await loadOrder();
            } else {
                setSaveMsg(`❌ ${data.error || 'Failed to dispatch'}`);
            }
        } catch {
            setSaveMsg('❌ Network error');
        } finally {
            setDispatching(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-4xl">📦</div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Order not found</p>
                <button onClick={() => router.back()} className="mt-4 text-teal-600 font-medium">← Back</button>
            </div>
        );
    }

    const isReadOnly = order.status === 'dispatched' || order.status === 'delivered';
    const statusLabel = order.status === 'confirmed' ? 'New — Awaiting Preparation'
        : order.status === 'processing' ? 'Processing — In Preparation'
            : order.status === 'dispatched' ? 'Dispatched'
                : order.status === 'delivered' ? 'Delivered' : order.status;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => router.push('/hub/orders')}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                    <FiArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FiPackage className="w-5 h-5 text-teal-500" />
                        Prepare Order — {order.orderNumber}
                    </h1>
                    <p className={`text-sm font-medium mt-0.5 ${order.status === 'dispatched' ? 'text-purple-600' :
                        order.status === 'delivered' ? 'text-green-600' :
                            order.status === 'processing' ? 'text-cyan-600' : 'text-blue-600'
                        }`}>
                        {statusLabel}
                    </p>
                </div>
                {saveMsg && <span className="text-sm font-medium">{saveMsg}</span>}
            </div>

            {/* Order Summary */}
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl border border-teal-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                    <FiUser className="w-4 h-4 text-teal-600" />
                    <h2 className="font-semibold text-gray-800">Order Summary</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">Buyer</p>
                        <p className="font-medium text-gray-800">{order.buyerId?.companyName}</p>
                        <p className="text-xs text-gray-500">{order.buyerId?.contactPerson} • {order.buyerId?.phone}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Quantity</p>
                        <p className="text-2xl font-bold text-gray-800">{order.quantityTonnes}<span className="text-sm font-normal"> T</span></p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Price/T</p>
                        <p className="font-medium text-gray-800">₹{order.pricePerTonne?.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Total Amount</p>
                        <p className="text-xl font-bold text-green-600">₹{order.totalAmount?.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Section 1: Stock Allocation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiBox className="w-4 h-4 text-orange-500" />
                    <h2 className="font-semibold text-gray-800">Stock Allocation</h2>
                    {order.stockAllocated?.allocatedQtyTonnes && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Allocated
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-orange-500">Requested</p>
                        <p className="text-xl font-bold text-orange-700">{order.quantityTonnes}T</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Allocate from Storage (T)</label>
                        <input type="number" value={allocatedQty}
                            onChange={(e) => setAllocatedQty(e.target.value)}
                            disabled={isReadOnly} step="0.1" min="0"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-teal-500 outline-none disabled:bg-gray-50"
                            placeholder={String(order.quantityTonnes)} />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-400">Balance</p>
                        <p className={`text-xl font-bold ${(order.quantityTonnes - (parseFloat(allocatedQty) || 0)) <= 0 ? 'text-green-600' : 'text-red-500'
                            }`}>
                            {(order.quantityTonnes - (parseFloat(allocatedQty) || 0)).toFixed(1)}T
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 2: Quality Validation */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiClipboard className="w-4 h-4 text-purple-500" />
                    <h2 className="font-semibold text-gray-800">Quality Validation Report</h2>
                    {order.qualityReport?.calorificValue && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Completed
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {QUALITY_FIELDS.map((f) => (
                        <div key={f.key}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                {f.label} <span className="text-gray-300">({f.unit})</span>
                            </label>
                            <input type="number" value={quality[f.key] || ''}
                                onChange={(e) => setQuality(prev => ({ ...prev, [f.key]: e.target.value }))}
                                disabled={isReadOnly} step="0.01"
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm
                                           focus:border-purple-500 outline-none disabled:bg-gray-50"
                                placeholder={f.placeholder} />
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-600">Torrefied</label>
                    <button
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => setTorrefied(!torrefied)}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${torrefied ? 'bg-purple-500' : 'bg-gray-300'
                            }`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${torrefied ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                    </button>
                    <span className="text-sm text-gray-500">{torrefied ? 'Yes' : 'No'}</span>
                </div>
            </div>

            {/* Section 3: Shipment Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                    <FiTruck className="w-4 h-4 text-blue-500" />
                    <h2 className="font-semibold text-gray-800">Shipment Details</h2>
                    {order.shipmentDetails?.trackingId && (
                        <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            ✓ Ready
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Shipping Date</label>
                        <input type="date" value={shipment.shippingDate}
                            onChange={(e) => setShipment(p => ({ ...p, shippingDate: e.target.value }))}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-gray-50" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Tracking ID *</label>
                        <input type="text" value={shipment.trackingId}
                            onChange={(e) => setShipment(p => ({ ...p, trackingId: e.target.value }))}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-gray-50"
                            placeholder="TRK-2026-XXXX" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Vehicle Number</label>
                        <input type="text" value={shipment.vehicleNumber}
                            onChange={(e) => setShipment(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-gray-50"
                            placeholder="PB 10 XX 1234" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Driver Name</label>
                        <input type="text" value={shipment.driverName}
                            onChange={(e) => setShipment(p => ({ ...p, driverName: e.target.value }))}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-gray-50"
                            placeholder="Driver name" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Driver Phone</label>
                        <input type="tel" value={shipment.driverPhone}
                            onChange={(e) => setShipment(p => ({ ...p, driverPhone: e.target.value }))}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-gray-50"
                            placeholder="98XXXXXXXX" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Estimated Delivery</label>
                        <input type="date" value={shipment.estimatedDelivery}
                            onChange={(e) => setShipment(p => ({ ...p, estimatedDelivery: e.target.value }))}
                            disabled={isReadOnly}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 outline-none disabled:bg-gray-50" />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            {!isReadOnly && (
                <div className="flex gap-4 pb-8">
                    <button onClick={saveProgress} disabled={saving}
                        className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-xl
                                   hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? '⏳ Saving...' : '💾 Save Progress'}
                    </button>
                    <button onClick={handleDispatch} disabled={dispatching || !shipment.trackingId}
                        className="flex-1 py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl
                                   hover:from-teal-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2
                                   disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200">
                        {dispatching ? '⏳ Dispatching...' : (
                            <>
                                <FiSend className="w-5 h-5" />
                                Dispatch Order
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowConfirm(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}>
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <FiSend className="w-6 h-6 text-teal-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">Dispatch Order?</h3>
                            <p className="text-sm text-gray-500 mt-2">
                                Make sure quality report and shipment details are filled correctly.
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowConfirm(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={confirmDispatch}
                                className="flex-1 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700">
                                ✅ Confirm Dispatch
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dispatched Confirmation */}
            {isReadOnly && (
                <div className={`rounded-2xl p-6 text-center ${order.status === 'delivered' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'
                    }`}>
                    <FiCheckCircle className={`w-10 h-10 mx-auto mb-2 ${order.status === 'delivered' ? 'text-green-500' : 'text-purple-500'
                        }`} />
                    <p className={`font-semibold text-lg ${order.status === 'delivered' ? 'text-green-700' : 'text-purple-700'
                        }`}>
                        {order.status === 'delivered' ? 'Order Delivered ✅' : 'Order Dispatched 🚚'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        {order.shipmentDetails?.trackingId && `Tracking: ${order.shipmentDetails.trackingId}`}
                    </p>
                </div>
            )}
        </div>
    );
}
