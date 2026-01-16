'use client';

import React, { useEffect, useState } from 'react';
import { FiDroplet, FiPackage, FiAlertCircle, FiPlus, FiX, FiSave } from 'react-icons/fi';

interface QualitySettings {
    maxMoisturePercent: number;
    acceptedBaleTypes: ('medium' | 'large')[];
    rejectionReasons: string[];
}

export default function QualitySettingsPage() {
    const [settings, setSettings] = useState<QualitySettings>({
        maxMoisturePercent: 15,
        acceptedBaleTypes: ['medium', 'large'],
        rejectionReasons: ['High moisture', 'Contamination', 'Under-weight'],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [newReason, setNewReason] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const token = localStorage.getItem('buyerToken');
            const res = await fetch('/api/buyer/quality-settings', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setSettings(data.data.settings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('buyerToken');
            const res = await fetch('/api/buyer/quality-settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            const data = await res.json();
            if (data.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSaving(false);
        }
    };

    const toggleBaleType = (type: 'medium' | 'large') => {
        setSettings(prev => ({
            ...prev,
            acceptedBaleTypes: prev.acceptedBaleTypes.includes(type)
                ? prev.acceptedBaleTypes.filter(t => t !== type)
                : [...prev.acceptedBaleTypes, type]
        }));
    };

    const addRejectionReason = () => {
        if (newReason.trim() && !settings.rejectionReasons.includes(newReason.trim())) {
            setSettings(prev => ({
                ...prev,
                rejectionReasons: [...prev.rejectionReasons, newReason.trim()]
            }));
            setNewReason('');
        }
    };

    const removeRejectionReason = (reason: string) => {
        setSettings(prev => ({
            ...prev,
            rejectionReasons: prev.rejectionReasons.filter(r => r !== reason)
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin text-4xl">⚙️</div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Quality Settings</h1>
                <p className="text-gray-500 mt-1">Configure your quality requirements for deliveries</p>
            </div>

            {/* Moisture Level */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FiDroplet className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Maximum Moisture Level</h3>
                        <p className="text-sm text-gray-500">Set the acceptable moisture percentage</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">0%</span>
                        <span className="text-lg font-bold text-emerald-600">{settings.maxMoisturePercent}%</span>
                        <span className="text-sm text-gray-600">100%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="50"
                        value={settings.maxMoisturePercent}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxMoisturePercent: Number(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <p className="text-xs text-gray-500">
                        Deliveries with moisture above {settings.maxMoisturePercent}% should be rejected
                    </p>
                </div>
            </div>

            {/* Bale Types */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <FiPackage className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Accepted Bale Types</h3>
                        <p className="text-sm text-gray-500">Select which bale sizes you accept</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={() => toggleBaleType('medium')}
                        className={`flex-1 py-4 rounded-xl border-2 transition-all ${settings.acceptedBaleTypes.includes('medium')
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                    >
                        <div className="text-2xl mb-1">📦</div>
                        <div className="font-medium">Medium Bale</div>
                        <div className="text-xs opacity-70">~20-25 kg</div>
                    </button>
                    <button
                        onClick={() => toggleBaleType('large')}
                        className={`flex-1 py-4 rounded-xl border-2 transition-all ${settings.acceptedBaleTypes.includes('large')
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                    >
                        <div className="text-2xl mb-1">📦📦</div>
                        <div className="font-medium">Large Bale</div>
                        <div className="text-xs opacity-70">~35-40 kg</div>
                    </button>
                </div>
            </div>

            {/* Rejection Reasons */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                        <FiAlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Rejection Reasons</h3>
                        <p className="text-sm text-gray-500">Manage your list of rejection reasons</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {settings.rejectionReasons.map((reason) => (
                        <div
                            key={reason}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <span className="text-gray-700">{reason}</span>
                            <button
                                onClick={() => removeRejectionReason(reason)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <div className="flex gap-2 mt-4">
                        <input
                            type="text"
                            value={newReason}
                            onChange={(e) => setNewReason(e.target.value)}
                            placeholder="Add new reason..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-emerald-500 outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && addRejectionReason()}
                        />
                        <button
                            onClick={addRejectionReason}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                            <FiPlus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${saved
                        ? 'bg-green-600 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-50`}
            >
                {saving ? (
                    <span className="animate-spin">⏳</span>
                ) : saved ? (
                    <>
                        <FiCheck className="w-5 h-5" />
                        Saved Successfully
                    </>
                ) : (
                    <>
                        <FiSave className="w-5 h-5" />
                        Save Settings
                    </>
                )}
            </button>
        </div>
    );
}

function FiCheck(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    );
}
