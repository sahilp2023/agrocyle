'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiPackage, FiArrowDown, FiArrowUp, FiX, FiTrash2, FiTruck, FiCheck, FiUser } from 'react-icons/fi';

interface CompletedAssignment {
    _id: string;
    bookingId: {
        _id: string;
        cropType: string;
        estimatedStubbleTonnes: number;
        actualStubbleTonnes?: number;
        farmerId: {
            name: string;
            phone: string;
        };
    };
    balerId: {
        vehicleNumber: string;
        operatorName: string;
    };
    actualQuantityTonnes: number;
    completedAt: string;
}

interface InventoryEntry {
    _id: string;
    type: 'inbound' | 'outbound';
    quantityTonnes: number;
    farmerName?: string;
    buyerName?: string;
    vehicleNumber?: string;
    notes?: string;
    createdAt: string;
}

interface Stats {
    totalInbound: number;
    totalOutbound: number;
    currentStock: number;
}

export default function InventoryPage() {
    const [entries, setEntries] = useState<InventoryEntry[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalInbound: 0,
        totalOutbound: 0,
        currentStock: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');

    // Completed assignments for inbound
    const [completedAssignments, setCompletedAssignments] = useState<CompletedAssignment[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);

    // Add entry modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [entryType, setEntryType] = useState<'inbound' | 'outbound'>('inbound');
    const [selectedAssignment, setSelectedAssignment] = useState<CompletedAssignment | null>(null);
    const [quantity, setQuantity] = useState('');
    const [farmerName, setFarmerName] = useState('');
    const [buyerName, setBuyerName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [operatorName, setOperatorName] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        loadInventory();
    }, [activeTab]);

    const loadInventory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);

            const res = await fetch(`/api/hub/inventory?hubId=${manager.hub._id}&type=${activeTab}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setEntries(data.data.entries || []);
                setStats(data.data.stats || { totalInbound: 0, totalOutbound: 0, currentStock: 0 });
            }
        } catch (error) {
            console.error('Failed to load inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCompletedAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const token = localStorage.getItem('hubToken');
            const managerData = localStorage.getItem('hubManager');
            if (!managerData) return;

            const manager = JSON.parse(managerData);

            // Fetch completed assignments
            const res = await fetch(`/api/hub/assignments?hubId=${manager.hub._id}&status=completed`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                // Filter to only show assignments not yet added to inventory
                setCompletedAssignments(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load assignments:', error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const openAddModal = (type: 'inbound' | 'outbound') => {
        setEntryType(type);
        setSelectedAssignment(null);
        setQuantity('');
        setFarmerName('');
        setBuyerName('');
        setVehicleNumber('');
        setOperatorName('');
        setNotes('');
        setFormError('');
        setModalOpen(true);

        // Load completed assignments for inbound entries
        if (type === 'inbound') {
            loadCompletedAssignments();
        }
    };

    const handleAssignmentSelect = (assignment: CompletedAssignment) => {
        setSelectedAssignment(assignment);
        // Auto-fill form fields
        setQuantity((assignment.actualQuantityTonnes || assignment.bookingId?.actualStubbleTonnes || assignment.bookingId?.estimatedStubbleTonnes || 0).toString());
        setFarmerName(assignment.bookingId?.farmerId?.name || '');
        setVehicleNumber(assignment.balerId?.vehicleNumber || '');
        setOperatorName(assignment.balerId?.operatorName || '');
        setNotes(`Pickup completed on ${new Date(assignment.completedAt).toLocaleDateString('en-IN')} - ${assignment.bookingId?.cropType || 'Stubble'}`);
    };

    const handleAddEntry = async () => {
        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setFormError('Please enter a valid quantity');
            return;
        }

        if (entryType === 'inbound' && !farmerName.trim()) {
            setFormError('Please enter farmer name or select an assignment');
            return;
        }

        if (entryType === 'outbound' && !buyerName.trim()) {
            setFormError('Please enter buyer name');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch('/api/hub/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: entryType,
                    quantityTonnes: qty,
                    farmerName: entryType === 'inbound' ? farmerName : undefined,
                    buyerName: entryType === 'outbound' ? buyerName : undefined,
                    vehicleNumber,
                    notes: operatorName ? `${notes} | Operator: ${operatorName}` : notes,
                    assignmentId: selectedAssignment?._id,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setModalOpen(false);
                setActiveTab(entryType);
                await loadInventory();
            } else {
                setFormError(data.message || 'Failed to add entry');
            }
        } catch (error) {
            console.error('Failed to add entry:', error);
            setFormError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteEntry = async (entryId: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch(`/api/hub/inventory?entryId=${entryId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                await loadInventory();
            }
        } catch (error) {
            console.error('Failed to delete entry:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Track inbound and outbound stubble stock
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => openAddModal('inbound')}
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 
                                   text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <FiArrowDown className="w-5 h-5" />
                        Add Inbound
                    </button>
                    <button
                        onClick={() => openAddModal('outbound')}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                                   text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <FiArrowUp className="w-5 h-5" />
                        Add Outbound
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <FiArrowDown className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-green-600 font-medium">Total Inbound</p>
                            <p className="text-2xl font-bold text-green-700">{stats.totalInbound.toFixed(1)} T</p>
                        </div>
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FiArrowUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Outbound</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.totalOutbound.toFixed(1)} T</p>
                        </div>
                    </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <FiPackage className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-purple-600 font-medium">Current Stock</p>
                            <p className="text-2xl font-bold text-purple-700">{stats.currentStock.toFixed(1)} T</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('inbound')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'inbound'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <FiArrowDown className="w-4 h-4" />
                        Inbound
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('outbound')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'outbound'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <span className="flex items-center gap-2">
                        <FiArrowUp className="w-4 h-4" />
                        Outbound
                    </span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">📦</div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiPackage className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No {activeTab} entries yet</p>
                        <button
                            onClick={() => openAddModal(activeTab)}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            + Add first entry
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">
                                        {activeTab === 'inbound' ? 'Farmer' : 'Buyer'}
                                    </th>
                                    <th className="px-6 py-4">Quantity</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Notes</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entries.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {entry.farmerName || entry.buyerName || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 font-semibold ${activeTab === 'inbound' ? 'text-green-600' : 'text-blue-600'
                                                }`}>
                                                {activeTab === 'inbound' ? (
                                                    <FiArrowDown className="w-4 h-4" />
                                                ) : (
                                                    <FiArrowUp className="w-4 h-4" />
                                                )}
                                                {entry.quantityTonnes} T
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {entry.vehicleNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {entry.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleDeleteEntry(entry._id)}
                                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Entry Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 ${entryType === 'inbound' ? 'bg-green-50' : 'bg-blue-50'
                            }`}>
                            <div className="flex items-center gap-3">
                                {entryType === 'inbound' ? (
                                    <FiArrowDown className="w-6 h-6 text-green-600" />
                                ) : (
                                    <FiArrowUp className="w-6 h-6 text-blue-600" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-800">
                                    Add {entryType === 'inbound' ? 'Inbound' : 'Outbound'} Entry
                                </h3>
                            </div>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Completed Assignments Selection (for inbound only) */}
                            {entryType === 'inbound' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select from Completed Pickups
                                    </label>
                                    {loadingAssignments ? (
                                        <div className="text-center py-4">
                                            <div className="animate-spin text-2xl">🌾</div>
                                        </div>
                                    ) : completedAssignments.length === 0 ? (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-500 text-sm">
                                            No completed pickups available
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2">
                                            {completedAssignments.map((assignment) => (
                                                <button
                                                    key={assignment._id}
                                                    onClick={() => handleAssignmentSelect(assignment)}
                                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${selectedAssignment?._id === assignment._id
                                                        ? 'border-green-500 bg-green-50'
                                                        : 'border-gray-100 hover:border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                <FiCheck className="w-5 h-5 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">
                                                                    {assignment.bookingId?.farmerId?.name || 'Unknown Farmer'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {assignment.balerId?.operatorName} • {assignment.balerId?.vehicleNumber}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold text-green-600">
                                                                {assignment.actualQuantityTonnes || assignment.bookingId?.actualStubbleTonnes || assignment.bookingId?.estimatedStubbleTonnes} T
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {new Date(assignment.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedAssignment && (
                                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                                            <FiCheck className="w-4 h-4" />
                                            Selected: {selectedAssignment.bookingId?.farmerId?.name}
                                        </div>
                                    )}
                                    <div className="relative my-4">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white text-gray-400">or enter manually</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity (Tonnes) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="Enter quantity"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Farmer/Buyer Name */}
                            {entryType === 'inbound' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Farmer Name <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={farmerName}
                                            onChange={(e) => setFarmerName(e.target.value)}
                                            placeholder="Enter farmer name"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                       focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Buyer Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={buyerName}
                                        onChange={(e) => setBuyerName(e.target.value)}
                                        placeholder="Enter buyer/company name"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            {/* Vehicle Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vehicle Number {entryType === 'inbound' && selectedAssignment ? '' : '(optional)'}
                                </label>
                                <div className="relative">
                                    <FiTruck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                        placeholder="e.g. HR-12-AB-1234"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Operator Name (for inbound with assignment) */}
                            {entryType === 'inbound' && operatorName && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Baler Operator
                                    </label>
                                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
                                        {operatorName}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Any additional notes..."
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            {/* Error */}
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                                    {formError}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-3 p-6 border-t border-gray-100 sticky bottom-0 bg-white">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-600 font-medium 
                                           hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddEntry}
                                disabled={saving}
                                className={`flex-1 py-3 px-4 text-white font-medium rounded-xl transition-colors ${entryType === 'inbound'
                                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-gray-300'
                                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300'
                                    }`}
                            >
                                {saving ? 'Adding...' : 'Add Entry'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
