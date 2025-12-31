'use client';

import React, { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiDollarSign, FiCheck, FiX, FiPackage, FiClock, FiDownload } from 'react-icons/fi';

interface Farmer {
    _id: string;
    name: string;
    phone: string;
    village?: string;
    city?: string;
}

interface Booking {
    _id: string;
    farmId: {
        plotName: string;
        areaAcre: number;
    };
    cropType: string;
    estimatedStubbleTonnes: number;
    actualStubbleTonnes?: number;
    completedAt?: string;
}

interface BookingSummary {
    bookings: Booking[];
    summary: {
        totalBookings: number;
        totalQuantityTonnes: number;
    };
}

interface Payout {
    _id: string;
    farmerId: Farmer;
    totalQuantityTonnes: number;
    breakdown: {
        baseAmount: number;
        subsidy: number;
        balingCost: number;
        logisticsDeduction: number;
        netPayable: number;
    };
    status: string;
    createdAt: string;
}

export default function PayoutsPage() {
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Payout form state
    const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
    const [farmerBookings, setFarmerBookings] = useState<BookingSummary | null>(null);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Calculation state
    const [basePrice, setBasePrice] = useState(2000); // Default ₹2000/tonne
    const [subsidyRate, setSubsidyRate] = useState(500); // ₹500 govt subsidy per tonne
    const [balingCostRate, setBalingCostRate] = useState(300); // ₹300/tonne
    const [logisticsRate, setLogisticsRate] = useState(150); // ₹150/tonne
    const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

    // Processing state
    const [processing, setProcessing] = useState(false);
    const [processError, setProcessError] = useState('');
    const [processSuccess, setProcessSuccess] = useState(false);

    useEffect(() => {
        loadFarmers();
        loadPayouts();
    }, []);

    const loadFarmers = async () => {
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

    const loadPayouts = async () => {
        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch('/api/hub/payouts', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setPayouts(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load payouts:', error);
        }
    };

    const loadFarmerBookings = async (farmer: Farmer) => {
        setSelectedFarmer(farmer);
        setFarmerBookings(null);
        setSelectedBookingIds([]);
        setProcessSuccess(false);
        setProcessError('');
        setLoadingBookings(true);

        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch(`/api/hub/farmer-bookings?farmerId=${farmer._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setFarmerBookings(data.data);
                // Auto-select all bookings
                setSelectedBookingIds(data.data.bookings.map((b: Booking) => b._id));
            }
        } catch (error) {
            console.error('Failed to load farmer bookings:', error);
        } finally {
            setLoadingBookings(false);
        }
    };

    const toggleBookingSelection = (bookingId: string) => {
        setSelectedBookingIds((prev) =>
            prev.includes(bookingId)
                ? prev.filter((id) => id !== bookingId)
                : [...prev, bookingId]
        );
    };

    // Calculate totals based on selected bookings
    const selectedBookings = farmerBookings?.bookings.filter((b) =>
        selectedBookingIds.includes(b._id)
    ) || [];

    const totalQuantity = selectedBookings.reduce(
        (sum, b) => sum + (b.actualStubbleTonnes || b.estimatedStubbleTonnes || 0),
        0
    );

    const baseAmount = totalQuantity * basePrice;
    const subsidyAmount = totalQuantity * subsidyRate;
    const balingCost = totalQuantity * balingCostRate;
    const logisticsDeduction = totalQuantity * logisticsRate;
    const netPayable = baseAmount + subsidyAmount - balingCost - logisticsDeduction;

    const handleProcessPayout = async () => {
        if (!selectedFarmer || selectedBookingIds.length === 0) return;

        setProcessing(true);
        setProcessError('');

        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch('/api/hub/payouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    farmerId: selectedFarmer._id,
                    bookingIds: selectedBookingIds,
                    totalQuantityTonnes: totalQuantity,
                    basePrice,
                    subsidyAmount,
                    balingCost,
                    logisticsDeduction,
                    netPayable,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setProcessSuccess(true);
                setSelectedFarmer(null);
                setFarmerBookings(null);
                setSelectedBookingIds([]);
                await loadPayouts();
            } else {
                setProcessError(data.message || 'Failed to process payout');
            }
        } catch (error) {
            console.error('Failed to process payout:', error);
            setProcessError('Network error. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const filteredFarmers = farmers.filter((f) =>
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.phone?.includes(search)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Stats from payouts
    const totalDisbursed = payouts
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + (p.breakdown?.netPayable || 0), 0);
    const pendingPayouts = payouts.filter((p) => p.status === 'pending').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Farmer Payouts</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Process payments for completed pickups
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-green-600 uppercase">Total Disbursed</p>
                        <p className="text-lg font-bold text-green-700">{formatCurrency(totalDisbursed)}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-amber-600 uppercase">Pending</p>
                        <p className="text-lg font-bold text-amber-700">{pendingPayouts}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Farmer Selection */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Farmer</h2>

                    <div className="relative mb-4">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search farmers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin text-2xl">🌾</div>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {filteredFarmers.map((farmer) => (
                                <button
                                    key={farmer._id}
                                    onClick={() => loadFarmerBookings(farmer)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedFarmer?._id === farmer._id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <FiUser className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{farmer.name}</p>
                                            <p className="text-xs text-gray-400">
                                                {farmer.village || farmer.city} • {farmer.phone}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filteredFarmers.length === 0 && (
                                <p className="text-center text-gray-400 py-4">No farmers found</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Booking Details & Calculation */}
                <div className="lg:col-span-2 space-y-6">
                    {!selectedFarmer ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <FiDollarSign className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">Select a farmer to process payout</p>
                        </div>
                    ) : loadingBookings ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <div className="animate-spin text-4xl">🌾</div>
                            <p className="text-gray-500 mt-4">Loading bookings...</p>
                        </div>
                    ) : !farmerBookings || farmerBookings.bookings.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <FiPackage className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No completed pickups pending payout</p>
                            <p className="text-sm text-gray-400 mt-1">
                                Complete some pickups for {selectedFarmer.name} first
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Completed Pickups */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Completed Pickups for {selectedFarmer.name}
                                </h3>

                                <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {farmerBookings.bookings.map((booking) => (
                                        <label
                                            key={booking._id}
                                            className={`flex items-center gap-4 p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedBookingIds.includes(booking._id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBookingIds.includes(booking._id)}
                                                onChange={() => toggleBookingSelection(booking._id)}
                                                className="w-5 h-5 text-blue-600 rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">
                                                    {booking.farmId?.plotName || 'Unknown Plot'}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {booking.cropType} • {booking.actualStubbleTonnes || booking.estimatedStubbleTonnes} tonnes
                                                </p>
                                            </div>
                                            <span className="text-green-600 font-medium">
                                                {formatCurrency((booking.actualStubbleTonnes || booking.estimatedStubbleTonnes) * basePrice)}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                <p className="text-sm text-gray-500 mt-3">
                                    {selectedBookingIds.length} of {farmerBookings.bookings.length} pickups selected
                                </p>
                            </div>

                            {/* Payout Calculation */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payout Calculation</h3>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Base Price (₹/tonne)
                                        </label>
                                        <input
                                            type="number"
                                            value={basePrice}
                                            onChange={(e) => setBasePrice(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Subsidy (₹/tonne)
                                        </label>
                                        <input
                                            type="number"
                                            value={subsidyRate}
                                            onChange={(e) => setSubsidyRate(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Baling Cost (₹/tonne)
                                        </label>
                                        <input
                                            type="number"
                                            value={balingCostRate}
                                            onChange={(e) => setBalingCostRate(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Logistics (₹/tonne)
                                        </label>
                                        <input
                                            type="number"
                                            value={logisticsRate}
                                            onChange={(e) => setLogisticsRate(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="border-t border-gray-100 pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Total Quantity</span>
                                        <span className="font-medium">{totalQuantity.toFixed(2)} tonnes</span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Base Amount ({totalQuantity.toFixed(2)} × ₹{basePrice})</span>
                                        <span className="font-medium">{formatCurrency(baseAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>+ Govt Subsidy</span>
                                        <span className="font-medium">+{formatCurrency(subsidyAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-500">
                                        <span>- Baling Cost</span>
                                        <span className="font-medium">-{formatCurrency(balingCost)}</span>
                                    </div>
                                    <div className="flex justify-between text-red-500">
                                        <span>- Logistics Deduction</span>
                                        <span className="font-medium">-{formatCurrency(logisticsDeduction)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                                        <span>Net Payable</span>
                                        <span className="text-green-600">{formatCurrency(netPayable)}</span>
                                    </div>
                                </div>

                                {/* Error */}
                                {processError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm mt-4">
                                        {processError}
                                    </div>
                                )}

                                {/* Success */}
                                {processSuccess && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-600 text-sm mt-4 flex items-center gap-2">
                                        <FiCheck className="w-5 h-5" />
                                        Payout processed successfully!
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    onClick={handleProcessPayout}
                                    disabled={selectedBookingIds.length === 0 || processing || netPayable <= 0}
                                    className="w-full mt-6 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
                                               text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        'Processing...'
                                    ) : (
                                        <>
                                            <FiCheck className="w-5 h-5" />
                                            Confirm & Process Payout
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}

                    {/* Recent Payouts */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Payouts</h3>

                        {payouts.length === 0 ? (
                            <p className="text-center text-gray-400 py-4">No payouts yet</p>
                        ) : (
                            <div className="space-y-3">
                                {payouts.slice(0, 5).map((payout) => (
                                    <div
                                        key={payout._id}
                                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payout.status === 'completed'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-amber-100 text-amber-600'
                                            }`}>
                                            {payout.status === 'completed' ? (
                                                <FiCheck className="w-5 h-5" />
                                            ) : (
                                                <FiClock className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-800">
                                                {payout.farmerId?.name || 'Unknown Farmer'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {payout.totalQuantityTonnes} tonnes •{' '}
                                                {new Date(payout.createdAt).toLocaleDateString('en-IN')}
                                            </p>
                                        </div>
                                        <span className="font-semibold text-green-600">
                                            {formatCurrency(payout.breakdown?.netPayable || 0)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
