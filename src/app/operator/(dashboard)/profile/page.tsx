'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiPhone, FiTruck, FiCreditCard, FiLogOut, FiEdit2, FiSave, FiX, FiStar, FiCheckCircle } from 'react-icons/fi';

interface OperatorProfile {
    _id: string;
    phone: string;
    name: string;
    profilePhoto?: string;
    operatorType: string;
    vehicleNumber: string;
    vehicleModel?: string;
    licenseNumber?: string;
    upiId?: string;
    isVerified: boolean;
    isOnline: boolean;
    totalJobs: number;
    totalEarnings: number;
    rating?: number;
    hubId?: { name: string; city: string };
    createdAt: string;
}

export default function OperatorProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<OperatorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Edit fields
    const [editName, setEditName] = useState('');
    const [editOperatorType, setEditOperatorType] = useState('baler');
    const [editVehicleNumber, setEditVehicleNumber] = useState('');
    const [editVehicleModel, setEditVehicleModel] = useState('');
    const [editLicense, setEditLicense] = useState('');
    const [editUpi, setEditUpi] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        const token = localStorage.getItem('operatorToken');
        try {
            const res = await fetch('/api/operator/profile', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setEditName(data.data.name);
                setEditOperatorType(data.data.operatorType || 'baler');
                setEditVehicleNumber(data.data.vehicleNumber);
                setEditVehicleModel(data.data.vehicleModel || '');
                setEditLicense(data.data.licenseNumber || '');
                setEditUpi(data.data.upiId || '');
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editName.trim()) {
            setError('Name is required');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const token = localStorage.getItem('operatorToken');
            const res = await fetch('/api/operator/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: editName,
                    operatorType: editOperatorType,
                    vehicleNumber: editVehicleNumber.toUpperCase(),
                    vehicleModel: editVehicleModel,
                    licenseNumber: editLicense,
                    upiId: editUpi,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setEditing(false);
                // Update localStorage
                const stored = localStorage.getItem('operator');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    localStorage.setItem('operator', JSON.stringify({
                        ...parsed,
                        name: editName,
                        vehicleNumber: editVehicleNumber.toUpperCase(),
                    }));
                }
            } else {
                setError(data.error || 'Failed to update');
            }
        } catch {
            setError('Network error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('operatorToken');
        localStorage.removeItem('operator');
        router.push('/operator/login');
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-4xl">👤</div>
            </div>
        );
    }

    if (!profile) return null;

    const operatorTypeLabel = profile.operatorType === 'both' ? 'Baler & Truck' :
        profile.operatorType === 'baler' ? 'Baler Operator' : 'Truck Operator';

    return (
        <div className="p-4 space-y-4">
            {/* Profile Header */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">
                            {profile.operatorType === 'truck' ? '🚛' : '🚜'}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold">{profile.name}</h2>
                        <p className="text-white/80 text-sm">+91 {profile.phone}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{operatorTypeLabel}</span>
                            {profile.isVerified && (
                                <span className="text-xs bg-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <FiCheckCircle className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
                    <div className="text-center">
                        <p className="text-2xl font-bold">{profile.totalJobs}</p>
                        <p className="text-xs text-white/70">Jobs</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold">₹{(profile.totalEarnings || 0).toLocaleString()}</p>
                        <p className="text-xs text-white/70">Earned</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold flex items-center justify-center gap-1">
                            {profile.rating || '5.0'} <FiStar className="w-4 h-4 text-yellow-300" />
                        </p>
                        <p className="text-xs text-white/70">Rating</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                {editing ? (
                    <>
                        <button onClick={() => { setEditing(false); setError(''); }}
                            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-medium flex items-center justify-center gap-1.5 text-sm">
                            <FiX className="w-4 h-4" /> Cancel
                        </button>
                        <button onClick={handleSave} disabled={saving}
                            className="flex-1 py-2.5 bg-orange-600 text-white rounded-xl font-medium flex items-center justify-center gap-1.5 text-sm disabled:opacity-50">
                            {saving ? '...' : <><FiSave className="w-4 h-4" /> Save</>}
                        </button>
                    </>
                ) : (
                    <button onClick={() => setEditing(true)}
                        className="flex-1 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 font-medium flex items-center justify-center gap-1.5 text-sm hover:bg-gray-50">
                        <FiEdit2 className="w-4 h-4" /> Edit Profile
                    </button>
                )}
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}

            {/* Details */}
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {/* Name */}
                <div className="p-4 flex items-center gap-3">
                    <FiUser className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">Full Name</p>
                        {editing ? (
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 border-b border-orange-300 focus:border-orange-500 outline-none py-1" />
                        ) : (
                            <p className="text-sm font-medium text-gray-800">{profile.name}</p>
                        )}
                    </div>
                </div>

                {/* Operator Type */}
                <div className="p-4 flex items-center gap-3">
                    <FiTruck className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">Operator Type</p>
                        {editing ? (
                            <div className="flex gap-2 mt-1">
                                {(['baler', 'truck', 'both'] as const).map(type => (
                                    <button key={type} type="button"
                                        onClick={() => setEditOperatorType(type)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all ${editOperatorType === type
                                                ? 'border-orange-500 bg-orange-50 text-orange-700'
                                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}>
                                        {type === 'baler' ? '🚜 Baler' : type === 'truck' ? '🚛 Truck' : '🚜🚛 Both'}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-gray-800">{operatorTypeLabel}</p>
                        )}
                    </div>
                </div>

                {/* Phone */}
                <div className="p-4 flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-gray-400" />
                    <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-800">+91 {profile.phone}</p>
                    </div>
                </div>

                {/* Vehicle */}
                <div className="p-4 flex items-center gap-3">
                    <FiTruck className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">Vehicle Number</p>
                        {editing ? (
                            <input type="text" value={editVehicleNumber} onChange={(e) => setEditVehicleNumber(e.target.value.toUpperCase())}
                                className="w-full text-sm font-medium text-gray-800 border-b border-orange-300 focus:border-orange-500 outline-none py-1 uppercase" />
                        ) : (
                            <p className="text-sm font-medium text-gray-800">{profile.vehicleNumber}</p>
                        )}
                    </div>
                </div>

                {/* Vehicle Model */}
                <div className="p-4 flex items-center gap-3">
                    <FiTruck className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">Vehicle Model</p>
                        {editing ? (
                            <input type="text" value={editVehicleModel} onChange={(e) => setEditVehicleModel(e.target.value)}
                                placeholder="e.g. John Deere 459"
                                className="w-full text-sm font-medium text-gray-800 border-b border-orange-300 focus:border-orange-500 outline-none py-1" />
                        ) : (
                            <p className="text-sm font-medium text-gray-800">{profile.vehicleModel || 'Not set'}</p>
                        )}
                    </div>
                </div>

                {/* UPI */}
                <div className="p-4 flex items-center gap-3">
                    <FiCreditCard className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                        <p className="text-xs text-gray-400">UPI ID</p>
                        {editing ? (
                            <input type="text" value={editUpi} onChange={(e) => setEditUpi(e.target.value)}
                                placeholder="yourname@upi"
                                className="w-full text-sm font-medium text-gray-800 border-b border-orange-300 focus:border-orange-500 outline-none py-1" />
                        ) : (
                            <p className="text-sm font-medium text-gray-800">{profile.upiId || 'Not set'}</p>
                        )}
                    </div>
                </div>

                {/* Hub */}
                {profile.hubId && (
                    <div className="p-4 flex items-center gap-3">
                        <span className="text-lg">🏢</span>
                        <div>
                            <p className="text-xs text-gray-400">Linked Hub</p>
                            <p className="text-sm font-medium text-gray-800">
                                {profile.hubId.name} • {profile.hubId.city}
                            </p>
                        </div>
                    </div>
                )}

                {/* Joined Date */}
                <div className="p-4 flex items-center gap-3">
                    <span className="text-lg">📅</span>
                    <div>
                        <p className="text-xs text-gray-400">Joined</p>
                        <p className="text-sm font-medium text-gray-800">
                            {new Date(profile.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric',
                            })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
                className="w-full py-3 border-2 border-red-200 text-red-600 font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 transition-colors">
                <FiLogOut className="w-5 h-5" /> Logout
            </button>

            <p className="text-center text-gray-400 text-xs pb-4">AgroCycle Operator Portal v1.0</p>
        </div>
    );
}
