'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCalendar, FiPackage, FiMapPin } from 'react-icons/fi';

interface Hub {
    _id: string;
    name: string;
    code: string;
    city: string;
    state: string;
}

export default function CreateOrderPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [hubs, setHubs] = useState<Hub[]>([]);
    const [loadingHubs, setLoadingHubs] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        hubId: '',
        quantityTonnes: '',
        requestedDateStart: '',
        requestedDateEnd: '',
        pricePerTonne: '',
        notes: '',
    });

    useEffect(() => {
        loadHubs();
    }, []);

    const loadHubs = async () => {
        try {
            const token = localStorage.getItem('buyerToken');
            const res = await fetch('/api/buyer/hubs', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setHubs(data.data.hubs);
            }
        } catch (error) {
            console.error('Failed to load hubs:', error);
        } finally {
            setLoadingHubs(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.hubId || !formData.quantityTonnes || !formData.requestedDateStart) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('buyerToken');
            const res = await fetch('/api/buyer/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/buyer/orders');
                }, 2000);
            } else {
                setError(data.error || 'Failed to create order');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Order Created!</h2>
                    <p className="text-gray-600">Redirecting to orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                >
                    <FiArrowLeft />
                    Back
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Create New Order</h1>
                <p className="text-gray-500 mt-1">Place a new order for stubble delivery</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                {/* Hub Selection */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiMapPin className="w-4 h-4" />
                        Delivery Location (Hub) *
                    </label>
                    {loadingHubs ? (
                        <div className="animate-pulse h-12 bg-gray-100 rounded-xl" />
                    ) : (
                        <select
                            value={formData.hubId}
                            onChange={(e) => setFormData(prev => ({ ...prev, hubId: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none"
                            required
                        >
                            <option value="">Select a hub</option>
                            {hubs.map((hub) => (
                                <option key={hub._id} value={hub._id}>
                                    {hub.name} ({hub.code}) - {hub.city}, {hub.state}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Quantity */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiPackage className="w-4 h-4" />
                        Required Quantity (Tonnes) *
                    </label>
                    <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formData.quantityTonnes}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantityTonnes: e.target.value }))}
                        placeholder="Enter quantity in tonnes"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none"
                        required
                    />
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="w-4 h-4" />
                            Preferred Start Date *
                        </label>
                        <input
                            type="date"
                            value={formData.requestedDateStart}
                            onChange={(e) => setFormData(prev => ({ ...prev, requestedDateStart: e.target.value }))}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <FiCalendar className="w-4 h-4" />
                            Preferred End Date
                        </label>
                        <input
                            type="date"
                            value={formData.requestedDateEnd}
                            onChange={(e) => setFormData(prev => ({ ...prev, requestedDateEnd: e.target.value }))}
                            min={formData.requestedDateStart || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none"
                        />
                    </div>
                </div>

                {/* Price per Tonne */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Price per Tonne (₹)
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={formData.pricePerTonne}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerTonne: e.target.value }))}
                        placeholder="Enter agreed price per tonne"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none"
                    />
                </div>

                {/* Notes */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Additional Notes
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Any special requirements or notes..."
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 outline-none resize-none"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Order'}
                    </button>
                </div>
            </form>
        </div>
    );
}
