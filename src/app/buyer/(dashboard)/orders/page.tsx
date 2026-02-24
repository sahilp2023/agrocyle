'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiFilter, FiRefreshCw, FiCreditCard, FiCheck } from 'react-icons/fi';
import RazorpayPaymentButton from '@/components/payments/RazorpayPaymentButton';

interface Order {
    _id: string;
    orderNumber: string;
    quantityTonnes: number;
    pricePerTonne: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    paidAmount: number;
    requestedDate: string;
    hubId: { name: string; city: string; code: string };
    createdAt: string;
}

const STATUS_FILTERS = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Created' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'dispatched', label: 'Partially Delivered' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function BuyerOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadOrders();
    }, [statusFilter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('buyerToken');
            const url = statusFilter
                ? `/api/buyer/orders?status=${statusFilter}`
                : '/api/buyer/orders';

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setOrders(data.data.orders);
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'dispatched': return 'bg-purple-100 text-purple-700';
            case 'delivered': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Created';
            case 'confirmed': return 'Confirmed';
            case 'dispatched': return 'Partially Delivered';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return status;
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
                    <p className="text-gray-500 mt-1">Manage your stubble orders</p>
                </div>
                <button
                    onClick={() => router.push('/buyer/orders/create')}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                >
                    <FiPlus className="w-5 h-5" />
                    Create Order
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <FiFilter className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Filter by status:</span>
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
                        onClick={loadOrders}
                        className="ml-auto p-2 text-gray-400 hover:text-gray-600"
                        title="Refresh"
                    >
                        <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin text-4xl">🏭</div>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <div className="text-5xl mb-4">📦</div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No orders found</h3>
                    <p className="text-gray-500 mb-4">
                        {statusFilter ? 'No orders with this status' : 'Create your first order to get started'}
                    </p>
                    <button
                        onClick={() => router.push('/buyer/orders/create')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                        Create Order
                    </button>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Order #</th>
                                    <th className="px-6 py-4">Hub</th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm font-medium text-emerald-600">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-800">
                                                {order.hubId?.name || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {order.hubId?.city}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {order.quantityTonnes} tons
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {order.paymentStatus === 'completed' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    <FiCheck className="w-3 h-3" />
                                                    Paid
                                                </span>
                                            ) : order.status !== 'cancelled' ? (
                                                <RazorpayPaymentButton
                                                    orderId={order._id}
                                                    amount={order.totalAmount - (order.paidAmount || 0)}
                                                    orderNumber={order.orderNumber}
                                                    onSuccess={() => loadOrders()}
                                                    onError={(err) => alert(err)}
                                                    className="text-xs px-3 py-1.5"
                                                >
                                                    <FiCreditCard className="w-3 h-3" />
                                                    Pay Now
                                                </RazorpayPaymentButton>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {formatDate(order.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
