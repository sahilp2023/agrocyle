'use client';

import React, { useState, useEffect } from 'react';
import { FiCheck, FiClock, FiUser, FiX, FiPackage, FiCamera, FiEye, FiSearch } from 'react-icons/fi';

interface Assignment {
    _id: string;
    bookingId: {
        _id: string;
        cropType: string;
        estimatedStubbleTonnes: number;
        farmerId: { name: string; phone: string };
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
    operatorId?: {
        _id: string;
        name: string;
        phone: string;
        vehicleNumber: string;
    };
    status: string;
    operatorStatus?: string;
    assignedAt: string;
    completedAt?: string;
    actualQuantityTonnes?: number;
    baleCount?: number;
    loadWeightTonnes?: number;
    operatorRemarks?: string;
    timeRequired?: number;
    moistureContent?: number;
    photos?: { before: string[]; after: string[]; fieldCondition: string[] };
    farmerSignature?: string;
    notes?: string;
}

type Tab = 'in_progress' | 'in_review' | 'completed';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('in_progress');

    // Complete modal
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [actualQuantity, setActualQuantity] = useState('');
    const [completionNotes, setCompletionNotes] = useState('');
    const [completing, setCompleting] = useState(false);
    const [completeError, setCompleteError] = useState('');

    // Review modal
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewAssignment, setReviewAssignment] = useState<Assignment | null>(null);

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
        setActualQuantity(assignment.actualQuantityTonnes?.toString() || assignment.bookingId?.estimatedStubbleTonnes?.toString() || '');
        setCompletionNotes('');
        setCompleteError('');
        setCompleteModalOpen(true);
    };

    const openReviewModal = (assignment: Assignment) => {
        setReviewAssignment(assignment);
        setReviewModalOpen(true);
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
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
                await loadAssignments();
            } else {
                setCompleteError(data.message || 'Failed to complete assignment');
            }
        } catch {
            setCompleteError('Network error');
        } finally {
            setCompleting(false);
        }
    };

    const getEstimatedTime = (assignment: Assignment) => {
        const timePerTonne = assignment.balerId?.timePerTonne || 30;
        const tonnes = assignment.bookingId?.estimatedStubbleTonnes || 0;
        const totalMinutes = timePerTonne * tonnes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return hours > 0 ? `~${hours}h ${minutes}m` : `~${minutes} min`;
    };

    // Filter by tabs
    const inProgress = assignments.filter(a =>
        ['assigned', 'in_progress'].includes(a.status) &&
        (!a.operatorStatus || !['work_complete', 'delivered'].includes(a.operatorStatus))
    );
    const inReview = assignments.filter(a =>
        a.operatorStatus === 'work_complete' && a.status !== 'completed'
    );
    const completed = assignments.filter(a => a.status === 'completed' || a.operatorStatus === 'delivered');

    const tabData = {
        in_progress: inProgress,
        in_review: inReview,
        completed: completed,
    };

    const currentList = tabData[activeTab];

    const stats = {
        inProgress: inProgress.length,
        inReview: inReview.length,
        completedToday: completed.filter(a => {
            if (!a.completedAt) return false;
            return new Date(a.completedAt).toDateString() === new Date().toDateString();
        }).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Assignment Tracking</h1>
                    <p className="text-gray-500 text-sm mt-1">Monitor and review operator assignments</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-blue-600 uppercase">In Progress</p>
                        <p className="text-xl font-bold text-blue-700">{stats.inProgress}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-amber-600 uppercase">In Review</p>
                        <p className="text-xl font-bold text-amber-700">{stats.inReview}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-center">
                        <p className="text-xs text-green-600 uppercase">Done Today</p>
                        <p className="text-xl font-bold text-green-700">{stats.completedToday}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-0">
                <button onClick={() => setActiveTab('in_progress')}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px
                        ${activeTab === 'in_progress'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <FiClock className="w-4 h-4 inline mr-1.5" />
                    In Progress ({inProgress.length})
                </button>
                <button onClick={() => setActiveTab('in_review')}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px
                        ${activeTab === 'in_review'
                            ? 'border-amber-600 text-amber-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <FiEye className="w-4 h-4 inline mr-1.5" />
                    In Review ({inReview.length})
                    {inReview.length > 0 && (
                        <span className="ml-1.5 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{inReview.length}</span>
                    )}
                </button>
                <button onClick={() => setActiveTab('completed')}
                    className={`px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px
                        ${activeTab === 'completed'
                            ? 'border-green-600 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    <FiCheck className="w-4 h-4 inline mr-1.5" />
                    Completed ({completed.length})
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center">
                    <div className="animate-spin text-4xl">🚜</div>
                </div>
            ) : currentList.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
                    {activeTab === 'in_progress' && 'No active assignments'}
                    {activeTab === 'in_review' && 'No assignments pending review. Operators will submit work here once completed.'}
                    {activeTab === 'completed' && 'No completed assignments yet'}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Assignment</th>
                                    <th className="px-6 py-4">Farmer</th>
                                    <th className="px-6 py-4">Operator</th>
                                    <th className="px-6 py-4">
                                        {activeTab === 'completed' ? 'Completed' : 'Assigned'}
                                    </th>
                                    {activeTab === 'in_review' && <th className="px-6 py-4">Documentation</th>}
                                    {activeTab === 'completed' && <th className="px-6 py-4">Actual Qty</th>}
                                    <th className="px-6 py-4">
                                        {activeTab === 'in_progress' ? 'Est. Qty & Time' : 'Status'}
                                    </th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {currentList.map((a) => (
                                    <tr key={a._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className="text-blue-600 font-medium">
                                                AS-{a._id.slice(-4).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <FiUser className="w-4 h-4 text-gray-400" />
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {a.bookingId?.farmerId?.name || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        PR-{a.bookingId?._id.slice(-4).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">🚜</span>
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {a.operatorId?.name || a.balerId?.operatorName || 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {a.operatorId?.vehicleNumber || a.balerId?.vehicleNumber}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {activeTab === 'completed' && a.completedAt
                                                ? new Date(a.completedAt).toLocaleDateString('en-IN')
                                                : new Date(a.assignedAt).toLocaleString('en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                                })
                                            }
                                        </td>

                                        {/* In Review: Documentation column */}
                                        {activeTab === 'in_review' && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs">
                                                    {a.photos && (a.photos.before?.length > 0 || a.photos.after?.length > 0) && (
                                                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full flex items-center gap-1">
                                                            <FiCamera className="w-3 h-3" />
                                                            {(a.photos.before?.length || 0) + (a.photos.after?.length || 0)} photos
                                                        </span>
                                                    )}
                                                    {a.baleCount && (
                                                        <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded-full">
                                                            {a.baleCount} bales
                                                        </span>
                                                    )}
                                                    {a.farmerSignature && (
                                                        <span className="bg-green-50 text-green-600 px-2 py-1 rounded-full">✍️ Signed</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}

                                        {/* Completed: Actual qty */}
                                        {activeTab === 'completed' && (
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-green-600">
                                                    {a.actualQuantityTonnes || '-'} T
                                                </span>
                                            </td>
                                        )}

                                        {/* Qty/Status column */}
                                        <td className="px-6 py-4">
                                            {activeTab === 'in_progress' ? (
                                                <div>
                                                    <span className="font-semibold text-gray-800">
                                                        {a.bookingId?.estimatedStubbleTonnes || '-'} T
                                                    </span>
                                                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                                                        <FiClock className="w-3 h-3" /> {getEstimatedTime(a)}
                                                    </p>
                                                </div>
                                            ) : activeTab === 'in_review' ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                                                    <FiEye className="w-3 h-3" /> Awaiting Review
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600">
                                                    <FiCheck className="w-3 h-3" /> Completed
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            {activeTab === 'in_progress' && (
                                                <button onClick={() => openCompleteModal(a)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white
                                                        bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">
                                                    <FiCheck className="w-4 h-4" /> Complete
                                                </button>
                                            )}
                                            {activeTab === 'in_review' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => openReviewModal(a)}
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-white
                                                            bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                                                        <FiEye className="w-4 h-4" /> Review
                                                    </button>
                                                    <button onClick={() => openCompleteModal(a)}
                                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-white
                                                            bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors">
                                                        <FiCheck className="w-4 h-4" /> Approve
                                                    </button>
                                                </div>
                                            )}
                                            {activeTab === 'completed' && (
                                                <span className="text-sm text-gray-400">
                                                    {a.notes || '-'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Complete Assignment Modal */}
            {completeModalOpen && selectedAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800">Approve & Complete</h3>
                            <button onClick={() => setCompleteModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <p className="text-xs text-green-600 font-medium uppercase">Assignment</p>
                                <p className="font-semibold text-gray-800 mt-1">AS-{selectedAssignment._id.slice(-4).toUpperCase()}</p>
                                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                                    <span>Farmer: {selectedAssignment.bookingId?.farmerId?.name}</span>
                                    <span>Operator: {selectedAssignment.operatorId?.name || selectedAssignment.balerId?.operatorName}</span>
                                </div>
                            </div>
                            {selectedAssignment.baleCount && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                                    Operator reported: <strong>{selectedAssignment.baleCount} bales</strong>
                                    {selectedAssignment.loadWeightTonnes && <>, <strong>{selectedAssignment.loadWeightTonnes}T load</strong></>}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Actual Quantity (tonnes) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="number" step="0.1" min="0" value={actualQuantity}
                                        onChange={(e) => setActualQuantity(e.target.value)}
                                        placeholder="Enter actual weight"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
                                <textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)}
                                    placeholder="Any notes..." rows={2}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-green-500 outline-none resize-none" />
                            </div>
                            {completeError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{completeError}</div>
                            )}
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100">
                            <button onClick={() => setCompleteModalOpen(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={handleComplete} disabled={!actualQuantity || completing}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium rounded-xl">
                                {completing ? 'Completing...' : 'Confirm Completion'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Documentation Modal */}
            {reviewModalOpen && reviewAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Review — AS-{reviewAssignment._id.slice(-4).toUpperCase()}
                            </h3>
                            <button onClick={() => setReviewModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 uppercase">Farmer</p>
                                    <p className="font-medium text-gray-800">{reviewAssignment.bookingId?.farmerId?.name}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 uppercase">Operator</p>
                                    <p className="font-medium text-gray-800">{reviewAssignment.operatorId?.name || reviewAssignment.balerId?.operatorName}</p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-amber-600">Qty Bailed</p>
                                    <p className="text-xl font-bold text-amber-700">{reviewAssignment.actualQuantityTonnes || '-'}T</p>
                                </div>
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-blue-600">Time Taken</p>
                                    <p className="text-xl font-bold text-blue-700">{reviewAssignment.timeRequired ? `${reviewAssignment.timeRequired}m` : '-'}</p>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-green-600">Moisture</p>
                                    <p className="text-xl font-bold text-green-700">{reviewAssignment.moistureContent ? `${reviewAssignment.moistureContent}%` : '-'}</p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-purple-600">Bale Count</p>
                                    <p className="text-xl font-bold text-purple-700">{reviewAssignment.baleCount || '-'}</p>
                                </div>
                                <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-cyan-600">Est. Qty</p>
                                    <p className="text-xl font-bold text-cyan-700">{reviewAssignment.bookingId?.estimatedStubbleTonnes || '-'}T</p>
                                </div>
                            </div>

                            {/* Operator Remarks */}
                            {reviewAssignment.operatorRemarks && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 uppercase mb-1">Operator Remarks</p>
                                    <p className="text-sm text-gray-700">{reviewAssignment.operatorRemarks}</p>
                                </div>
                            )}

                            {/* Before Photos */}
                            {reviewAssignment.photos?.before && reviewAssignment.photos.before.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-2">📸 Before Photos</p>
                                    <div className="flex gap-2 overflow-x-auto">
                                        {reviewAssignment.photos.before.map((photo, i) => (
                                            <img key={i} src={photo} alt={`Before ${i + 1}`}
                                                className="w-32 h-24 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* After Photos */}
                            {reviewAssignment.photos?.after && reviewAssignment.photos.after.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-2">📸 After Photos</p>
                                    <div className="flex gap-2 overflow-x-auto">
                                        {reviewAssignment.photos.after.map((photo, i) => (
                                            <img key={i} src={photo} alt={`After ${i + 1}`}
                                                className="w-32 h-24 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Field Condition Photos */}
                            {reviewAssignment.photos?.fieldCondition && reviewAssignment.photos.fieldCondition.length > 0 && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-2">🌾 Field Condition</p>
                                    <div className="flex gap-2 overflow-x-auto">
                                        {reviewAssignment.photos.fieldCondition.map((photo, i) => (
                                            <img key={i} src={photo} alt={`Field ${i + 1}`}
                                                className="w-32 h-24 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Farmer Signature */}
                            {reviewAssignment.farmerSignature && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase mb-2">✍️ Farmer Signature</p>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 inline-block">
                                        <img src={reviewAssignment.farmerSignature} alt="Farmer Signature" className="h-20" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
                            <button onClick={() => setReviewModalOpen(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">
                                Close
                            </button>
                            <button onClick={() => {
                                setReviewModalOpen(false);
                                openCompleteModal(reviewAssignment);
                            }}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl flex items-center justify-center gap-2">
                                <FiCheck className="w-5 h-5" /> Approve & Complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
