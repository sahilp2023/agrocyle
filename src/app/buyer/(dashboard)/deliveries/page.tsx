'use client';

import React, { useEffect, useState } from 'react';
import { FiTruck, FiCheck, FiX, FiClock, FiFilter, FiRefreshCw } from 'react-icons/fi';

interface Delivery {
    _id: string;
    deliveryNumber: string;
    deliveryDate: string;
    vehicleNumber: string;
    driverName?: string;
    quantityTonnes: number;
    status: 'in_transit' | 'delivered' | 'accepted' | 'rejected';
    rejectionReason?: string;
    moistureLevel?: number;
    baleType?: string;
    orderId: { orderNumber: string; quantityTonnes: number };
    hubId: { name: string; city: string };
}

const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
];

export default function BuyerDeliveriesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showRejectModal, setShowRejectModal] = useState<Delivery | null>(null);
    const [rejectionReason, setRejectionReason] = useState('high_moisture');

    useEffect(() => {
        loadDeliveries();
    }, [statusFilter]);

    const loadDeliveries = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('buyerToken');
            const url = statusFilter
                ? `/api/buyer/deliveries?status=${statusFilter}`
                : '/api/buyer/deliveries';

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setDeliveries(data.data.deliveries);
            }
        } catch (error) {
            console.error('Failed to load deliveries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (deliveryId: string, action: 'accept' | 'reject', reason?: string) => {
        setActionLoading(deliveryId);
        try {
            const token = localStorage.getItem('buyerToken');
            const res = await fetch(`/api/buyer/deliveries/${deliveryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action, rejectionReason: reason }),
            });

            const data = await res.json();
            if (data.success) {
                loadDeliveries();
                setShowRejectModal(null);
            }
        } catch (error) {
            console.error('Action failed:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'in_transit': return { bg: 'bg-blue-100', text: 'text-blue-700', icon: FiTruck };
            case 'delivered': return { bg: 'bg-amber-100', text: 'text-amber-700', icon: FiClock };
            case 'accepted': return { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheck };
            case 'rejected': return { bg: 'bg-red-100', text: 'text-red-700', icon: FiX };
            default: return { bg: 'bg-gray-100', text: 'text-gray-700', icon: FiClock };
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Deliveries</h1>
                <p className="text-gray-500 mt-1">Track and manage incoming deliveries</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <FiFilter className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Status:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_FILTERS.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === filter.value
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={loadDeliveries}
                        className="ml-auto p-2 text-gray-400 hover:text-gray-600"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Deliveries List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin text-4xl">🚚</div>
                </div>
            ) : deliveries.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <FiTruck className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No deliveries found</h3>
                    <p className="text-gray-500">
                        {statusFilter ? 'No deliveries with this status' : 'Deliveries will appear here once orders are dispatched'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {deliveries.map((delivery) => {
                        const statusStyle = getStatusStyle(delivery.status);
                        const StatusIcon = statusStyle.icon;

                        return (
                            <div key={delivery._id} className="bg-white rounded-xl border border-gray-200 p-5">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                    {/* Delivery Info */}
                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Delivery #</p>
                                            <p className="font-medium text-emerald-600">{delivery.deliveryNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Order #</p>
                                            <p className="font-medium text-gray-800">{delivery.orderId?.orderNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                                            <p className="font-medium text-gray-800">{delivery.vehicleNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Quantity</p>
                                            <p className="font-medium text-gray-800">{delivery.quantityTonnes} tons</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Hub</p>
                                            <p className="font-medium text-gray-800">{delivery.hubId?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Date/Time</p>
                                            <p className="text-sm text-gray-700">{formatDate(delivery.deliveryDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Status</p>
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {delivery.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        {delivery.rejectionReason && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Rejection Reason</p>
                                                <p className="text-sm text-red-600">{delivery.rejectionReason.replace('_', ' ')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    {delivery.status === 'delivered' && (
                                        <div className="flex gap-2 lg:flex-col">
                                            <button
                                                onClick={() => handleAction(delivery._id, 'accept')}
                                                disabled={actionLoading === delivery._id}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <FiCheck className="w-4 h-4" />
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(delivery)}
                                                disabled={actionLoading === delivery._id}
                                                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <FiX className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Delivery</h3>
                        <p className="text-gray-600 mb-4">
                            Select a reason for rejecting delivery <strong>{showRejectModal.deliveryNumber}</strong>
                        </p>
                        <select
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4"
                        >
                            <option value="high_moisture">High Moisture</option>
                            <option value="contamination">Contamination</option>
                            <option value="under_weight">Under Weight</option>
                            <option value="other">Other</option>
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(null)}
                                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleAction(showRejectModal._id, 'reject', rejectionReason)}
                                disabled={actionLoading === showRejectModal._id}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
