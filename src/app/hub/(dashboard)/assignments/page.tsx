'use client';

import React, { useState, useEffect } from 'react';
import { FiCheck, FiClock, FiUser, FiTruck, FiX, FiPackage } from 'react-icons/fi';

interface Assignment {
    _id: string;
    bookingId: {
        _id: string;
        cropType: string;
        estimatedStubbleTonnes: number;
        farmerId: {
            name: string;
            phone: string;
        };
    };
    balerId: {
        vehicleNumber: string;
        operatorName: string;
        timePerTonne?: number;
    };
    truckId?: {
        vehicleNumber: string;
        operatorName: string;
        capacity?: number;
    };
    status: string;
    assignedAt: string;
    completedAt?: string;
    actualQuantityTonnes?: number;
    notes?: string;
}

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    // Complete modal state
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [actualQuantity, setActualQuantity] = useState('');
    const [completionNotes, setCompletionNotes] = useState('');
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState('');

    useEffect(() => {
        loadAssignments();
    }, []);

    const loadAssignments = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);

            const res = await fetch(`/api/hub/assignments?hubId=${manager.hub._id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setAssignments(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCompleteModal = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setActualQuantity(assignment.bookingId?.estimatedStubbleTonnes?.toString() || '');
        setCompletionNotes('');
        setCompleteError('');
        setCompleteModalOpen(true);
    };

    const handleComplete = async () => {
        if (!selectedAssignment) return;

        const qty = parseFloat(actualQuantity);
        if (isNaN(qty) || qty <= 0) {
            setCompleteError('Please enter a valid quantity');
            return;
        }

        setCompleting(true);
        setCompleteError('');

        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch('/api/hub/assignments', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    assignmentId: selectedAssignment._id,
                    status: 'completed',
                    actualQuantityTonnes: qty,
                    notes: completionNotes,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setCompleteModalOpen(false);
                setSelectedAssignment(null);
                setActualQuantity('');
                setCompletionNotes('');
                await loadAssignments();
            } else {
                setCompleteError(data.message || 'Failed to complete assignment');
            }
        } catch (error) {
            console.error('Failed to complete:', error);
            setCompleteError('Network error. Please try again.');
        } finally {
            setCompleting(false);
        }
    };

    // Calculate estimated time for an assignment
    const getEstimatedTime = (assignment: Assignment) => {
        const timePerTonne = assignment.balerId?.timePerTonne || 30;
        const tonnes = assignment.bookingId?.estimatedStubbleTonnes || 0;
        const totalMinutes = timePerTonne * tonnes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);

        if (hours > 0) {
            return `~${hours}h ${minutes}m`;
        }
        return `~${minutes} min`;
    };

    const inProgress = assignments.filter(a => ['assigned', 'in_progress'].includes(a.status));
    const completed = assignments.filter(a => a.status === 'completed');

    const stats = {
        inProgress: inProgress.length,
        completedToday: completed.filter(a => {
            if (!a.completedAt) return false;
            const today = new Date().toDateString();
            return new Date(a.completedAt).toDateString() === today;
        }).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Assignment Tracking</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Monitor baler assignments and mark completions
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-blue-600 uppercase">In Progress</p>
                        <p className="text-xl font-bold text-blue-700">{stats.inProgress}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-green-600 uppercase">Completed Today</p>
                        <p className="text-xl font-bold text-green-700">{stats.completedToday}</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center">
                    <div className="animate-spin text-4xl">🚜</div>
                </div>
            ) : (
                <>
                    {/* In Progress Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            In Progress ({inProgress.length})
                        </h2>

                        {inProgress.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                                No active assignments
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-4">Assignment</th>
                                            <th className="px-6 py-4">Farmer</th>
                                            <th className="px-6 py-4">Baler</th>
                                            <th className="px-6 py-4">Truck</th>
                                            <th className="px-6 py-4">Est. Qty & Time</th>
                                            <th className="px-6 py-4">Assigned</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {inProgress.map((assignment) => (
                                            <tr key={assignment._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className="text-blue-600 font-medium">
                                                        AS-{assignment._id.slice(-4).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <FiUser className="w-4 h-4 text-gray-400" />
                                                        <div>
                                                            <p className="font-medium text-gray-800">
                                                                {assignment.bookingId?.farmerId?.name || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                PR-{assignment.bookingId?._id.slice(-4).toUpperCase()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">🚜</span>
                                                        <div>
                                                            <p className="font-medium text-gray-800">
                                                                {assignment.balerId?.operatorName || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {assignment.balerId?.vehicleNumber}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {assignment.truckId ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">🚛</span>
                                                            <div>
                                                                <p className="font-medium text-gray-800">
                                                                    {assignment.truckId.operatorName}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {assignment.truckId.vehicleNumber}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">No truck</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="font-semibold text-gray-800">
                                                            {assignment.bookingId?.estimatedStubbleTonnes || '-'} T
                                                        </span>
                                                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                            <FiClock className="w-3 h-3" />
                                                            {getEstimatedTime(assignment)}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(assignment.assignedAt).toLocaleString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                                        <FiClock className="w-3 h-3" />
                                                        In Progress
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => openCompleteModal(assignment)}
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-white 
                                                                   bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <FiCheck className="w-4 h-4" />
                                                        Complete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Completed Section */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Completed ({completed.length})
                        </h2>

                        {completed.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                                No completed assignments yet
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-4">Assignment</th>
                                            <th className="px-6 py-4">Farmer</th>
                                            <th className="px-6 py-4">Baler</th>
                                            <th className="px-6 py-4">Truck</th>
                                            <th className="px-6 py-4">Completed</th>
                                            <th className="px-6 py-4">Actual Qty</th>
                                            <th className="px-6 py-4">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {completed.slice(0, 10).map((assignment) => (
                                            <tr key={assignment._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <span className="text-blue-600 font-medium">
                                                        AS-{assignment._id.slice(-4).toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-800">
                                                    {assignment.bookingId?.farmerId?.name || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {assignment.balerId?.operatorName || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {assignment.truckId?.operatorName || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {assignment.completedAt
                                                        ? new Date(assignment.completedAt).toLocaleDateString('en-IN')
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-green-600">
                                                        {assignment.actualQuantityTonnes || '-'} T
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {assignment.notes || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Complete Assignment Modal */}
            {completeModalOpen && selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">Mark Assignment Complete</h3>
                            <button
                                onClick={() => setCompleteModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Assignment Info */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-xs text-green-600 font-medium uppercase">Assignment</p>
                                <p className="font-semibold text-gray-800 mt-1">
                                    AS-{selectedAssignment._id.slice(-4).toUpperCase()}
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                                    <span>Farmer: {selectedAssignment.bookingId?.farmerId?.name}</span>
                                    <span>Baler: {selectedAssignment.balerId?.operatorName}</span>
                                    {selectedAssignment.truckId && (
                                        <span className="col-span-2">Truck: {selectedAssignment.truckId.operatorName}</span>
                                    )}
                                </div>
                            </div>

                            {/* Actual Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Actual Quantity Collected (tonnes) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={actualQuantity}
                                        onChange={(e) => setActualQuantity(e.target.value)}
                                        placeholder="Enter actual weight"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                   focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Estimated: {selectedAssignment.bookingId?.estimatedStubbleTonnes} T •
                                    Time: {getEstimatedTime(selectedAssignment)}
                                </p>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Completion Notes (optional)
                                </label>
                                <textarea
                                    value={completionNotes}
                                    onChange={(e) => setCompletionNotes(e.target.value)}
                                    placeholder="Any notes about the pickup..."
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none resize-none"
                                />
                            </div>

                            {/* Error */}
                            {completeError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                                    {completeError}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button
                                onClick={() => setCompleteModalOpen(false)}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-medium 
                                           hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={!actualQuantity || completing}
                                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 
                                           text-white font-medium rounded-xl transition-colors"
                            >
                                {completing ? 'Completing...' : 'Confirm Completion'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
