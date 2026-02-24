'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiTruck, FiEdit2, FiUser, FiPhone, FiX, FiTrash2, FiStar, FiEye } from 'react-icons/fi';

interface OperatorFleet {
    _id: string;
    name: string;
    phone: string;
    operatorType: 'baler' | 'truck' | 'both';
    vehicleNumber: string;
    vehicleModel?: string;
    licenseNumber?: string;
    isOnline: boolean;
    isVerified: boolean;
    totalJobs: number;
    totalEarnings: number;
    rating?: number;
    createdAt: string;
}

const statusColors = {
    online: { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-500' },
    offline: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
};

export default function FleetManagementPage() {
    const router = useRouter();
    const [operators, setOperators] = useState<OperatorFleet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'baler' | 'truck' | 'both'>('all');

    // Edit modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingOperator, setEditingOperator] = useState<OperatorFleet | null>(null);
    const [editForm, setEditForm] = useState({ name: '', vehicleNumber: '', vehicleModel: '', operatorType: 'baler' as string });
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadOperators();
    }, []);

    const loadOperators = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch('/api/hub/operators?tab=verified', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setOperators(data.data.operators || []);
            }
        } catch (error) {
            console.error('Failed to load operators:', error);
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (op: OperatorFleet) => {
        setEditingOperator(op);
        setEditForm({
            name: op.name,
            vehicleNumber: op.vehicleNumber,
            vehicleModel: op.vehicleModel || '',
            operatorType: op.operatorType,
        });
        setFormError('');
        setEditModalOpen(true);
    };

    const handleEditSubmit = async () => {
        if (!editingOperator) return;
        if (!editForm.name.trim() || !editForm.vehicleNumber.trim()) {
            setFormError('Name and vehicle number are required');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch('/api/hub/operators', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    operatorId: editingOperator._id,
                    action: 'edit',
                    updates: editForm,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setEditModalOpen(false);
                await loadOperators();
            } else {
                setFormError(data.message || 'Failed to update');
            }
        } catch {
            setFormError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (operatorId: string) => {
        setDeleting(true);
        try {
            const token = localStorage.getItem('hubToken');
            await fetch('/api/hub/operators', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ operatorId, action: 'reject' }),
            });
            setDeleteConfirm(null);
            await loadOperators();
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            setDeleting(false);
        }
    };

    const filtered = operators.filter(op => {
        const matchesSearch =
            op.name.toLowerCase().includes(search.toLowerCase()) ||
            op.phone.includes(search) ||
            op.vehicleNumber.toLowerCase().includes(search.toLowerCase());
        const matchesType = typeFilter === 'all' || op.operatorType === typeFilter ||
            (typeFilter !== 'both' && op.operatorType === 'both');
        return matchesSearch && matchesType;
    });

    const balerCount = operators.filter(o => o.operatorType === 'baler' || o.operatorType === 'both').length;
    const truckCount = operators.filter(o => o.operatorType === 'truck' || o.operatorType === 'both').length;
    const onlineCount = operators.filter(o => o.isOnline).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Verified operators from Operator Portal — manage your field team
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-600 uppercase tracking-wider">Baler Operators</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{balerCount}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-600 uppercase tracking-wider">Truck Operators</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{truckCount}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-600 uppercase tracking-wider">Online Now</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{onlineCount}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <p className="text-xs text-purple-600 uppercase tracking-wider">Total Fleet</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{operators.length}</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <span>
                    Operators now register via the <strong>Operator Portal</strong> and are automatically added here once you verify them from the <strong>Operators → Onboarding</strong> section.
                </span>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search by name, phone, or vehicle..."
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" />
                </div>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-blue-500 outline-none bg-white">
                    <option value="all">All Types</option>
                    <option value="baler">Baler Operators</option>
                    <option value="truck">Truck Operators</option>
                    <option value="both">Both (Baler & Truck)</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">🚜</div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiTruck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No operators found. Operators register via the Operator Portal and appear here once verified.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Operator</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">Rating</th>
                                    <th className="px-6 py-4">Record</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((op) => {
                                    const status = op.isOnline ? statusColors.online : statusColors.offline;
                                    return (
                                        <tr key={op._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${op.operatorType === 'truck' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                                                        <FiUser className={`w-5 h-5 ${op.operatorType === 'truck' ? 'text-blue-600' : 'text-amber-600'}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{op.name}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <FiPhone className="w-3 h-3" /> +91 {op.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                                    ${op.operatorType === 'truck' ? 'bg-blue-50 text-blue-700' :
                                                        op.operatorType === 'both' ? 'bg-purple-50 text-purple-700' :
                                                            'bg-amber-50 text-amber-700'}`}>
                                                    {op.operatorType === 'baler' ? '🚜 Baler' :
                                                        op.operatorType === 'truck' ? '🚛 Truck' : '🚜🚛 Both'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-800">{op.vehicleNumber}</p>
                                                <p className="text-xs text-gray-400">{op.vehicleModel || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                    {op.isOnline ? 'Online' : 'Offline'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <span className="font-medium text-gray-800">{op.totalJobs}</span>
                                                    <span className="text-gray-400 ml-1">Jobs</span>
                                                </div>
                                                <p className="text-xs text-gray-400">₹{(op.totalEarnings || 0).toLocaleString()}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <FiStar className="w-3.5 h-3.5 text-yellow-500" />
                                                    <span className="text-sm font-medium text-gray-700">{op.rating || '5.0'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => router.push(`/hub/fleet/${op._id}`)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600
                                                        bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    title="View operator records">
                                                    <FiEye className="w-4 h-4" /> View
                                                </button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEditModal(op)}
                                                        className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Edit operator">
                                                        <FiEdit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(op._id)}
                                                        className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove operator">
                                                        <FiTrash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {
                editModalOpen && editingOperator && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-800">Edit Operator</h3>
                                <button onClick={() => setEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <FiX className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                    <input type="text" value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                                    <input type="text" value={editForm.vehicleNumber}
                                        onChange={(e) => setEditForm({ ...editForm, vehicleNumber: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Model</label>
                                    <input type="text" value={editForm.vehicleModel}
                                        onChange={(e) => setEditForm({ ...editForm, vehicleModel: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Operator Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['baler', 'truck', 'both'] as const).map(type => (
                                            <button key={type} type="button"
                                                onClick={() => setEditForm({ ...editForm, operatorType: type })}
                                                className={`p-3 rounded-xl border-2 text-center transition-all ${editForm.operatorType === type
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                                                <span className="text-lg">{type === 'baler' ? '🚜' : type === 'truck' ? '🚛' : '🚜🚛'}</span>
                                                <p className="text-xs font-medium mt-1 capitalize">{type}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {formError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{formError}</div>
                                )}
                            </div>
                            <div className="flex gap-3 p-6 border-t border-gray-100">
                                <button onClick={() => setEditModalOpen(false)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button onClick={handleEditSubmit} disabled={saving}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-xl">
                                    {saving ? 'Saving...' : 'Update Operator'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete Confirmation */}
            {
                deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-800">Remove Operator?</h3>
                            <p className="text-sm text-gray-500">
                                This will deactivate the operator from your fleet. They can re-register through the Operator Portal.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium">Cancel</button>
                                <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl disabled:opacity-50">
                                    {deleting ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
