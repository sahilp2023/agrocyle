'use client';

import React, { useState, useEffect } from 'react';
import {
    FiSearch,
    FiFilter,
    FiClock,
    FiMapPin,
    FiUser,
    FiPhone,
    FiCalendar,
    FiX,
    FiTruck,
    FiCheck,
} from 'react-icons/fi';

interface PickupRequest {
    _id: string;
    farmerId: {
        _id: string;
        name: string;
        phone: string;
        village?: string;
    };
    farmId: {
        plotName: string;
        areaAcre: number;
    };
    cropType: string;
    estimatedStubbleTonnes: number;
    preferredDate?: string;
    preferredSlot?: string;
    status: string;
    createdAt: string;
}

interface Vehicle {
    _id: string;
    vehicleType: 'baler' | 'truck';
    vehicleNumber: string;
    operatorName: string;
    status: string;
    timePerTonne?: number;
    capacity?: number;
}

export default function PickupRequestsPage() {
    const [requests, setRequests] = useState<PickupRequest[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');

    // Assignment modal state
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(null);
    const [selectedBaler, setSelectedBaler] = useState<string>('');
    const [selectedTruck, setSelectedTruck] = useState<string>('');
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState('');

    useEffect(() => {
        loadRequests();
        loadVehicles();
    }, [statusFilter]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);
            const params = new URLSearchParams({
                hubId: manager.hub._id,
                ...(statusFilter !== 'all' && { status: statusFilter }),
            });

            const res = await fetch(`/api/hub/requests?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setRequests(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadVehicles = async () => {
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);

            const res = await fetch(`/api/hub/balers?hubId=${manager.hub._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setVehicles(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load vehicles:', error);
        }
    };

    const openAssignModal = (request: PickupRequest) => {
        setSelectedRequest(request);
        setSelectedBaler('');
        setSelectedTruck('');
        setAssignError('');
        setAssignModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedRequest || !selectedBaler) {
            setAssignError('Please select a baler');
            return;
        }

        setAssigning(true);
        setAssignError('');

        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch('/api/hub/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bookingId: selectedRequest._id,
                    balerId: selectedBaler,
                    truckId: selectedTruck || undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setAssignModalOpen(false);
                setSelectedRequest(null);
                setSelectedBaler('');
                setSelectedTruck('');
                await loadRequests();
                await loadVehicles();
            } else {
                setAssignError(data.message || 'Failed to assign');
            }
        } catch (error) {
            console.error('Failed to assign:', error);
            setAssignError('Network error. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const filteredRequests = requests.filter((request) => {
        const matchesSearch =
            request.farmerId?.name?.toLowerCase().includes(search.toLowerCase()) ||
            request.farmerId?.village?.toLowerCase().includes(search.toLowerCase()) ||
            request._id.includes(search);

        return matchesSearch;
    });

    const getTimeRemaining = (dateStr: string | undefined) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (diff < 0) return { text: 'Overdue', color: 'text-red-600 bg-red-50' };
        if (days > 0) return { text: `${days}d left`, color: 'text-blue-600 bg-blue-50' };
        if (hours > 0) return { text: `${hours}h left`, color: 'text-amber-600 bg-amber-50' };
        return { text: 'Due soon', color: 'text-red-600 bg-red-50' };
    };

    const availableBalers = vehicles.filter(v => (v.vehicleType || 'baler') === 'baler' && v.status === 'available');
    const availableTrucks = vehicles.filter(v => v.vehicleType === 'truck' && v.status === 'available');

    // Calculate estimated time for selected baler
    const getEstimatedTime = () => {
        if (!selectedBaler || !selectedRequest) return null;
        const baler = availableBalers.find(b => b._id === selectedBaler);
        if (!baler) return null;

        const timePerTonne = baler.timePerTonne || 30;
        const tonnes = selectedRequest.estimatedStubbleTonnes || 0;
        const totalMinutes = timePerTonne * tonnes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} min`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pickup Requests</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage farmer pickup requests and assign equipment
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-amber-600 uppercase">Pending</p>
                        <p className="text-xl font-bold text-amber-700">
                            {requests.filter(r => r.status === 'pending').length}
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-blue-600 uppercase">Scheduled</p>
                        <p className="text-xl font-bold text-blue-700">
                            {requests.filter(r => r.status === 'scheduled').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by farmer, village, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg 
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="all">All Requests</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">🌾</div>
                    </div>
                ) : filteredRequests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiFilter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No requests found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Request ID</th>
                                    <th className="px-6 py-4">Farmer</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Est. Quantity</th>
                                    <th className="px-6 py-4">Preferred Date</th>
                                    <th className="px-6 py-4">Time Left</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.map((request) => {
                                    const timeRemaining = getTimeRemaining(request.preferredDate);

                                    return (
                                        <tr key={request._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className="text-blue-600 font-medium">
                                                    PR-{request._id.slice(-4).toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FiUser className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="font-medium text-gray-800">
                                                            {request.farmerId?.name || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <FiPhone className="w-3 h-3" />
                                                            {request.farmerId?.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <FiMapPin className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        {request.farmId?.plotName || request.farmerId?.village || 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-800">
                                                    {request.estimatedStubbleTonnes || '-'} tons
                                                </span>
                                                <p className="text-xs text-gray-400 capitalize">{request.cropType}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {request.preferredDate
                                                    ? new Date(request.preferredDate).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                    })
                                                    : '-'
                                                }
                                                {request.preferredSlot && (
                                                    <span className="text-xs text-gray-400 ml-1">({request.preferredSlot})</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {timeRemaining && (
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${timeRemaining.color}`}>
                                                        <FiClock className="w-3 h-3" />
                                                        {timeRemaining.text}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {request.status === 'pending' || request.status === 'confirmed' ? (
                                                    <button
                                                        onClick={() => openAssignModal(request)}
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-white 
                                                                   bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <FiTruck className="w-4 h-4" />
                                                        Assign
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">
                                                        {request.status === 'scheduled' ? 'Assigned' : request.status}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            {assignModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white">
                            <h3 className="text-lg font-semibold text-gray-800">Assign Equipment</h3>
                            <button
                                onClick={() => setAssignModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            {/* Request Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-xs text-blue-600 font-medium uppercase">Pickup Request</p>
                                <p className="font-semibold text-gray-800 mt-1">
                                    PR-{selectedRequest._id.slice(-4).toUpperCase()}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                                    <span>Farmer: {selectedRequest.farmerId?.name}</span>
                                    <span>Est: {selectedRequest.estimatedStubbleTonnes} tonnes</span>
                                </div>
                            </div>

                            {/* Select Baler */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Baler <span className="text-red-500">*</span>
                                </label>
                                {availableBalers.length === 0 ? (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-700 text-sm">
                                        No balers available. Add balers in Fleet Management.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {availableBalers.map((baler) => (
                                            <label
                                                key={baler._id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedBaler === baler._id
                                                    ? 'border-amber-500 bg-amber-50'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="baler"
                                                    value={baler._id}
                                                    checked={selectedBaler === baler._id}
                                                    onChange={(e) => setSelectedBaler(e.target.value)}
                                                    className="w-4 h-4 text-amber-600"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">🚜</span>
                                                        <p className="font-medium text-gray-800">{baler.vehicleNumber}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {baler.operatorName} • {baler.timePerTonne || 30} min/T
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Estimated Time */}
                            {selectedBaler && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-green-600 font-medium uppercase">Estimated Baling Time</p>
                                        <p className="text-lg font-bold text-green-700">{getEstimatedTime()}</p>
                                    </div>
                                    <FiClock className="w-8 h-8 text-green-400" />
                                </div>
                            )}

                            {/* Select Truck (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Select Truck (Optional)
                                </label>
                                {availableTrucks.length === 0 ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-500 text-sm">
                                        No trucks available
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        <label
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedTruck === ''
                                                ? 'border-gray-300 bg-gray-50'
                                                : 'border-gray-100 hover:border-gray-200'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="truck"
                                                value=""
                                                checked={selectedTruck === ''}
                                                onChange={() => setSelectedTruck('')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-500">No truck needed</span>
                                        </label>
                                        {availableTrucks.map((truck) => (
                                            <label
                                                key={truck._id}
                                                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedTruck === truck._id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-100 hover:border-gray-200'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="truck"
                                                    value={truck._id}
                                                    checked={selectedTruck === truck._id}
                                                    onChange={(e) => setSelectedTruck(e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">🚛</span>
                                                        <p className="font-medium text-gray-800">{truck.vehicleNumber}</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {truck.operatorName} • {truck.capacity || 5}T capacity
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {assignError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                                    {assignError}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setAssignModalOpen(false)}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-medium 
                                           hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={!selectedBaler || assigning}
                                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
                                           text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {assigning ? 'Assigning...' : (
                                    <>
                                        <FiCheck className="w-5 h-5" />
                                        Confirm Assignment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
