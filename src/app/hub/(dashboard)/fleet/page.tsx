'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiTruck, FiEdit2, FiUser, FiPhone, FiX, FiPackage, FiClock } from 'react-icons/fi';

interface Vehicle {
    _id: string;
    vehicleType: 'baler' | 'truck';
    vehicleNumber: string;
    balerModel?: string;
    operatorName: string;
    operatorPhone: string;
    ownerType: 'platform' | 'third_party';
    ownerName?: string;
    status: 'available' | 'busy' | 'maintenance';
    timePerTonne?: number;
    capacity?: number;
    nextServiceDate?: string;
    totalTrips: number;
    totalBales: number;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    available: { bg: 'bg-green-50', text: 'text-green-600' },
    busy: { bg: 'bg-orange-50', text: 'text-orange-600' },
    maintenance: { bg: 'bg-red-50', text: 'text-red-600' },
};

const emptyVehicle = {
    vehicleType: 'baler' as const,
    vehicleNumber: '',
    balerModel: '',
    operatorName: '',
    operatorPhone: '',
    ownerType: 'platform' as const,
    ownerName: '',
    timePerTonne: 30,
    capacity: 5,
};

export default function FleetManagementPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'baler' | 'truck'>('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Add/Edit modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [formData, setFormData] = useState(emptyVehicle);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = (type: 'baler' | 'truck') => {
        setEditingVehicle(null);
        setFormData({ ...emptyVehicle, vehicleType: type });
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            vehicleType: vehicle.vehicleType || 'baler',
            vehicleNumber: vehicle.vehicleNumber,
            balerModel: vehicle.balerModel || '',
            operatorName: vehicle.operatorName,
            operatorPhone: vehicle.operatorPhone,
            ownerType: vehicle.ownerType,
            ownerName: vehicle.ownerName || '',
            timePerTonne: vehicle.timePerTonne || 30,
            capacity: vehicle.capacity || 5,
        });
        setFormError('');
        setModalOpen(true);
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.vehicleNumber.trim()) {
            setFormError('Vehicle number is required');
            return;
        }
        if (!formData.operatorName.trim()) {
            setFormError('Operator/driver name is required');
            return;
        }
        if (!formData.operatorPhone.trim() || formData.operatorPhone.length < 10) {
            setFormError('Valid operator phone is required');
            return;
        }

        setSaving(true);
        setFormError('');

        try {
            const token = localStorage.getItem('hubToken');

            const url = '/api/hub/balers';
            const method = editingVehicle ? 'PATCH' : 'POST';
            const body = editingVehicle
                ? { balerId: editingVehicle._id, ...formData }
                : formData;

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                setModalOpen(false);
                setEditingVehicle(null);
                setFormData(emptyVehicle);
                await loadVehicles();
            } else {
                setFormError(data.message || 'Failed to save vehicle');
            }
        } catch (error) {
            console.error('Failed to save vehicle:', error);
            setFormError('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (vehicle: Vehicle, newStatus: 'available' | 'maintenance') => {
        try {
            const token = localStorage.getItem('hubToken');

            const res = await fetch('/api/hub/balers', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    balerId: vehicle._id,
                    status: newStatus,
                }),
            });

            const data = await res.json();
            if (data.success) {
                await loadVehicles();
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesSearch =
            vehicle.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
            vehicle.operatorName.toLowerCase().includes(search.toLowerCase());

        const matchesType = typeFilter === 'all' || (vehicle.vehicleType || 'baler') === typeFilter;
        const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    const balers = vehicles.filter(v => (v.vehicleType || 'baler') === 'baler');
    const trucks = vehicles.filter(v => v.vehicleType === 'truck');

    const stats = {
        totalBalers: balers.length,
        availableBalers: balers.filter(b => b.status === 'available').length,
        totalTrucks: trucks.length,
        availableTrucks: trucks.filter(t => t.status === 'available').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fleet Management</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage balers and pickup trucks
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => openAddModal('baler')}
                        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 
                                   text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <FiPlus className="w-5 h-5" />
                        Add Baler
                    </button>
                    <button
                        onClick={() => openAddModal('truck')}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 
                                   text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                        <FiPlus className="w-5 h-5" />
                        Add Truck
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-xs text-amber-600 uppercase tracking-wider">Total Balers</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{stats.totalBalers}</p>
                    <p className="text-xs text-amber-500 mt-1">{stats.availableBalers} available</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-600 uppercase tracking-wider">Total Trucks</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalTrucks}</p>
                    <p className="text-xs text-blue-500 mt-1">{stats.availableTrucks} available</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-xs text-green-600 uppercase tracking-wider">Total Available</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">
                        {stats.availableBalers + stats.availableTrucks}
                    </p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <p className="text-xs text-orange-600 uppercase tracking-wider">Currently Busy</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">
                        {vehicles.filter(v => v.status === 'busy').length}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search vehicle or operator..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg 
                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'baler' | 'truck')}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg 
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="all">All Types</option>
                    <option value="baler">Balers Only</option>
                    <option value="truck">Trucks Only</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg 
                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                >
                    <option value="all">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="maintenance">Maintenance</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin text-4xl">🚜</div>
                    </div>
                ) : filteredVehicles.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <FiTruck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No vehicles found. Add balers and trucks to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Operator</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Specs</th>
                                    <th className="px-6 py-4">Performance</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredVehicles.map((vehicle) => {
                                    const statusStyle = statusColors[vehicle.status];
                                    const isBaler = (vehicle.vehicleType || 'baler') === 'baler';

                                    return (
                                        <tr key={vehicle._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isBaler
                                                    ? 'bg-amber-50 text-amber-700'
                                                    : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {isBaler ? '🚜 Baler' : '🚛 Truck'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isBaler ? 'bg-amber-100' : 'bg-blue-100'
                                                        }`}>
                                                        <FiTruck className={`w-5 h-5 ${isBaler ? 'text-amber-600' : 'text-blue-600'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {vehicle.vehicleNumber}
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            {vehicle.balerModel || (isBaler ? 'Standard Baler' : 'Pickup Truck')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FiUser className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <p className="text-gray-800">{vehicle.operatorName}</p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <FiPhone className="w-3 h-3" />
                                                            {vehicle.operatorPhone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`
                                                    px-2 py-1 rounded text-xs font-medium
                                                    ${vehicle.ownerType === 'platform'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                    }
                                                `}>
                                                    {vehicle.ownerType === 'platform' ? 'AgroCycle' : vehicle.ownerName || 'Third Party'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`
                                                        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                                                        ${statusStyle.bg} ${statusStyle.text}
                                                    `}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${vehicle.status === 'available' ? 'bg-green-500' :
                                                            vehicle.status === 'busy' ? 'bg-orange-500' : 'bg-red-500'
                                                            }`} />
                                                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                                                    </span>
                                                    {vehicle.status === 'available' && (
                                                        <button
                                                            onClick={() => handleStatusChange(vehicle, 'maintenance')}
                                                            className="text-xs text-gray-400 hover:text-red-500"
                                                            title="Mark for maintenance"
                                                        >
                                                            🔧
                                                        </button>
                                                    )}
                                                    {vehicle.status === 'maintenance' && (
                                                        <button
                                                            onClick={() => handleStatusChange(vehicle, 'available')}
                                                            className="text-xs text-gray-400 hover:text-green-500"
                                                            title="Mark as available"
                                                        >
                                                            ✅
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-500">
                                                {isBaler ? (
                                                    <span className="flex items-center gap-1">
                                                        <FiClock className="w-3 h-3" />
                                                        {vehicle.timePerTonne || 30} min/T
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1">
                                                        <FiPackage className="w-3 h-3" />
                                                        {vehicle.capacity || 5} T capacity
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <span className="font-medium text-gray-800">{vehicle.totalTrips || 0}</span>
                                                    <span className="text-gray-400 ml-1">Trips</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => openEditModal(vehicle)}
                                                    className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Vehicle Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 ${formData.vehicleType === 'baler' ? 'bg-amber-50' : 'bg-blue-50'
                            }`}>
                            <h3 className="text-lg font-semibold text-gray-800">
                                {editingVehicle ? 'Edit' : 'Add New'} {formData.vehicleType === 'baler' ? 'Baler' : 'Truck'}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                            >
                                <FiX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Vehicle Type Toggle (only for new) */}
                            {!editingVehicle && (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, vehicleType: 'baler' })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.vehicleType === 'baler'
                                            ? 'border-amber-500 bg-amber-50 text-amber-700'
                                            : 'border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <span className="text-2xl">🚜</span>
                                        <p className="text-sm font-medium mt-1">Baler</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, vehicleType: 'truck' })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.vehicleType === 'truck'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <span className="text-2xl">🚛</span>
                                        <p className="text-sm font-medium mt-1">Truck</p>
                                    </button>
                                </div>
                            )}

                            {/* Vehicle Number */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vehicle Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.vehicleNumber}
                                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                                    placeholder="e.g. HR-12-AB-1234"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Model */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {formData.vehicleType === 'baler' ? 'Baler Model' : 'Truck Model'} (optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.balerModel}
                                    onChange={(e) => setFormData({ ...formData, balerModel: e.target.value })}
                                    placeholder={formData.vehicleType === 'baler' ? 'e.g. John Deere 459' : 'e.g. Tata Ace'}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                               focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            {/* Operator Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {formData.vehicleType === 'baler' ? 'Operator' : 'Driver'} Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={formData.operatorName}
                                        onChange={(e) => setFormData({ ...formData, operatorName: e.target.value })}
                                        placeholder="Full name"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Operator Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="tel"
                                        value={formData.operatorPhone}
                                        onChange={(e) => setFormData({ ...formData, operatorPhone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        placeholder="10-digit phone number"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Baler specific: Time per tonne */}
                            {formData.vehicleType === 'baler' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Time per Tonne (minutes)
                                    </label>
                                    <div className="relative">
                                        <FiClock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={formData.timePerTonne}
                                            onChange={(e) => setFormData({ ...formData, timePerTonne: Number(e.target.value) })}
                                            placeholder="30"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Used to estimate completion time</p>
                                </div>
                            )}

                            {/* Truck specific: Capacity */}
                            {formData.vehicleType === 'truck' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Load Capacity (tonnes)
                                    </label>
                                    <div className="relative">
                                        <FiPackage className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                                            placeholder="5"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl 
                                                       focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Owner Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Owner Type
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, ownerType: 'platform', ownerName: '' })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.ownerType === 'platform'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <span className="text-lg">🏢</span>
                                        <p className="text-sm font-medium mt-1">AgroCycle</p>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, ownerType: 'third_party' })}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${formData.ownerType === 'third_party'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 text-gray-600'
                                            }`}
                                    >
                                        <span className="text-lg">👤</span>
                                        <p className="text-sm font-medium mt-1">Third Party</p>
                                    </button>
                                </div>
                            </div>

                            {/* Owner Name (if third party) */}
                            {formData.ownerType === 'third_party' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Owner Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.ownerName}
                                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                        placeholder="Owner or company name"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl 
                                                   focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

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
                                onClick={handleSubmit}
                                disabled={saving}
                                className={`flex-1 py-3 px-4 text-white font-medium rounded-xl transition-colors ${formData.vehicleType === 'baler'
                                    ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300'
                                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300'
                                    }`}
                            >
                                {saving ? 'Saving...' : editingVehicle ? 'Update' : 'Add'} {formData.vehicleType === 'baler' ? 'Baler' : 'Truck'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
