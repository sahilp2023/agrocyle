'use client';

import React, { useEffect, useState } from 'react';
import { FiTruck, FiFilter, FiRefreshCw, FiChevronDown, FiChevronUp, FiCheckCircle, FiClock } from 'react-icons/fi';

interface QualityReport {
    calorificValue?: number;
    moistureContent?: number;
    pelletSize?: number;
    bulkDensity?: number;
    ashContent?: number;
    silicaInAsh?: number;
    sulfurContent?: number;
    chlorineContent?: number;
    torrefied?: boolean;
}

interface ShipmentDetails {
    shippingDate?: string;
    trackingId?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    estimatedDelivery?: string;
}

interface Delivery {
    _id: string;
    orderNumber: string;
    quantityTonnes: number;
    totalAmount: number;
    status: 'dispatched' | 'delivered';
    dispatchedDate?: string;
    deliveredDate?: string;
    hubId: { name: string; city: string; code: string };
    qualityReport?: QualityReport;
    shipmentDetails?: ShipmentDetails;
}

const QUALITY_LABELS: { key: keyof QualityReport; label: string; unit: string }[] = [
    { key: 'calorificValue', label: 'Calorific Value', unit: 'MJ/kg' },
    { key: 'moistureContent', label: 'Moisture Content', unit: '%' },
    { key: 'pelletSize', label: 'Pellet Size', unit: 'mm' },
    { key: 'bulkDensity', label: 'Bulk Density', unit: 'kg/m³' },
    { key: 'ashContent', label: 'Ash Content', unit: '%' },
    { key: 'silicaInAsh', label: 'Silica in Ash', unit: '%' },
    { key: 'sulfurContent', label: 'Sulfur Content', unit: '%' },
    { key: 'chlorineContent', label: 'Chlorine Content', unit: '%' },
];

export default function BuyerDeliveriesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => { loadDeliveries(); }, [filter]);

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('buyerToken');
            const params = new URLSearchParams();
            if (filter !== 'all') params.set('status', filter);
            const res = await fetch(`/api/buyer/deliveries?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setDeliveries(data.data || []);
            }
        } catch (err) {
            console.error('Failed to load deliveries:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (d?: string) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev => prev === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FiTruck className="w-7 h-7 text-blue-500" />
                        Deliveries
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Track your dispatched orders and quality reports</p>
                </div>
                <button onClick={loadDeliveries}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                    <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-gray-400" />
                {['all', 'dispatched', 'delivered'].map(s => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                        {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                ))}
            </div>

            {/* Deliveries List */}
            {loading ? (
                <div className="p-12 text-center"><div className="animate-spin text-4xl">🚚</div></div>
            ) : deliveries.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
                    <FiTruck className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>No deliveries yet</p>
                    <p className="text-sm mt-1">Dispatched orders will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((d) => (
                        <div key={d._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            {/* Summary Row */}
                            <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleExpand(d._id)}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${d.status === 'delivered' ? 'bg-green-100' : 'bg-purple-100'
                                    }`}>
                                    {d.status === 'delivered' ? '✅' : '🚚'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-mono font-medium text-blue-600 text-sm">{d.orderNumber}</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${d.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {d.status === 'delivered' ? <FiCheckCircle className="w-3 h-3" /> : <FiClock className="w-3 h-3" />}
                                            {d.status === 'delivered' ? 'Delivered' : 'In Transit'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        {d.hubId?.name} • {d.quantityTonnes}T • ₹{d.totalAmount?.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Dispatched: {formatDate(d.dispatchedDate)}
                                        {d.deliveredDate && ` • Delivered: ${formatDate(d.deliveredDate)}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {d.qualityReport?.calorificValue && (
                                        <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-lg">QC ✓</span>
                                    )}
                                    {expanded === d._id ? <FiChevronUp className="w-5 h-5 text-gray-400" /> : <FiChevronDown className="w-5 h-5 text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expanded === d._id && (
                                <div className="border-t border-gray-100 p-5 space-y-5 bg-gray-50/50">
                                    {/* Shipment Details */}
                                    {d.shipmentDetails && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                                                <FiTruck className="w-4 h-4 text-blue-500" /> Shipment Details
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {d.shipmentDetails.trackingId && (
                                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-400">Tracking ID</p>
                                                        <p className="font-mono font-medium text-gray-800 mt-0.5">{d.shipmentDetails.trackingId}</p>
                                                    </div>
                                                )}
                                                {d.shipmentDetails.vehicleNumber && (
                                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-400">Vehicle</p>
                                                        <p className="font-medium text-gray-800 mt-0.5">{d.shipmentDetails.vehicleNumber}</p>
                                                    </div>
                                                )}
                                                {d.shipmentDetails.driverName && (
                                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-400">Driver</p>
                                                        <p className="font-medium text-gray-800 mt-0.5">
                                                            {d.shipmentDetails.driverName}
                                                            {d.shipmentDetails.driverPhone && (
                                                                <span className="text-gray-400 text-xs ml-1">({d.shipmentDetails.driverPhone})</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                )}
                                                {d.shipmentDetails.shippingDate && (
                                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-400">Shipped On</p>
                                                        <p className="font-medium text-gray-800 mt-0.5">{formatDate(d.shipmentDetails.shippingDate)}</p>
                                                    </div>
                                                )}
                                                {d.shipmentDetails.estimatedDelivery && (
                                                    <div className="bg-white rounded-xl border border-gray-200 p-3">
                                                        <p className="text-xs text-gray-400">ETA</p>
                                                        <p className="font-medium text-amber-600 mt-0.5">{formatDate(d.shipmentDetails.estimatedDelivery)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quality Report */}
                                    {d.qualityReport && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                                                📋 Quality Validation Report
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {QUALITY_LABELS.map(q => {
                                                    const val = d.qualityReport?.[q.key];
                                                    if (val === undefined || val === null) return null;
                                                    return (
                                                        <div key={q.key} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                                                            <p className="text-xs text-gray-400">{q.label}</p>
                                                            <p className="text-lg font-bold text-gray-800 mt-1">{typeof val === 'number' ? val.toFixed(2) : String(val)}</p>
                                                            <p className="text-xs text-gray-300">{q.unit}</p>
                                                        </div>
                                                    );
                                                })}
                                                <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                                                    <p className="text-xs text-gray-400">Torrefied</p>
                                                    <p className="text-lg font-bold mt-1">
                                                        {d.qualityReport.torrefied ?
                                                            <span className="text-green-600">Yes ✓</span> :
                                                            <span className="text-gray-500">No</span>
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!d.qualityReport?.calorificValue && !d.shipmentDetails?.trackingId && (
                                        <p className="text-center text-gray-400 text-sm py-4">
                                            Details will be available once the hub prepares your order
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
