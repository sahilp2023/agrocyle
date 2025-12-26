'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { FiUser, FiPhone, FiCreditCard, FiLogOut, FiGlobe, FiEdit2 } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        title: 'मेरी प्रोफाइल',
        editProfile: 'प्रोफाइल बदलें',
        name: 'नाम',
        phone: 'फ़ोन',
        aadhaar: 'आधार',
        upiId: 'UPI ID',
        language: 'भाषा',
        hindi: 'हिंदी',
        english: 'English',
        logout: 'लॉग आउट',
        version: 'ऐप वर्शन',
        save: 'सेव करें',
        cancel: 'रद्द करें',
        kycVerified: 'सत्यापित',
        kycPending: 'सत्यापन बाकी',
    },
    en: {
        title: 'My Profile',
        editProfile: 'Edit Profile',
        name: 'Name',
        phone: 'Phone',
        aadhaar: 'Aadhaar',
        upiId: 'UPI ID',
        language: 'Language',
        hindi: 'हिंदी',
        english: 'English',
        logout: 'Logout',
        version: 'App Version',
        save: 'Save',
        cancel: 'Cancel',
        kycVerified: 'Verified',
        kycPending: 'Verification Pending',
    },
};

interface Farmer {
    id: string;
    name: string;
    phone: string;
    aadhaarNumber?: string;
    upiId?: string;
    kycVerified: boolean;
    language: 'hi' | 'en';
}

export default function ProfilePage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [farmer, setFarmer] = useState<Farmer | null>(null);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editUpiId, setEditUpiId] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const farmerData = localStorage.getItem('farmer');
        const token = localStorage.getItem('token');

        if (!farmerData || !token) {
            router.push(`/${locale}/login`);
            return;
        }

        const data = JSON.parse(farmerData);
        setFarmer(data);
        setEditName(data.name || '');
        setEditUpiId(data.upiId || '');
    }, [locale, router]);

    const handleSave = async () => {
        if (!farmer) return;

        setSaving(true);

        try {
            const token = localStorage.getItem('token');

            const res = await fetch('/api/farmers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: editName,
                    upiId: editUpiId,
                }),
            });

            const data = await res.json();

            if (data.success) {
                const updatedFarmer = { ...farmer, name: editName, upiId: editUpiId };
                setFarmer(updatedFarmer);
                localStorage.setItem('farmer', JSON.stringify(updatedFarmer));
                setEditing(false);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleLanguageChange = (newLocale: 'hi' | 'en') => {
        if (newLocale !== locale) {
            router.push(`/${newLocale}/profile`);
        }
    };

    const handleLogout = () => {
        const confirmText = locale === 'hi'
            ? 'क्या आप लॉग आउट करना चाहते हैं?'
            : 'Are you sure you want to logout?';

        if (confirm(confirmText)) {
            localStorage.removeItem('token');
            localStorage.removeItem('farmer');
            router.push(`/${locale}/login`);
        }
    };

    if (!farmer) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        );
    }

    return (
        <div className="safe-area-top">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 rounded-b-3xl">
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-lg">
                        👨‍🌾
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white">
                            {farmer.name || (locale === 'hi' ? 'किसान' : 'Farmer')}
                        </h1>
                        <p className="text-green-100">+91 {farmer.phone}</p>
                        <span
                            className={`
                inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium
                ${farmer.kycVerified
                                    ? 'bg-green-500 text-white'
                                    : 'bg-amber-500 text-white'
                                }
              `}
                        >
                            {farmer.kycVerified ? text.kycVerified : text.kycPending}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-4">
                {/* Profile Details */}
                <Card padding="none">
                    <div className="divide-y divide-gray-100">
                        <ProfileRow
                            icon={<FiUser />}
                            label={text.name}
                            value={farmer.name || '-'}
                        />
                        <ProfileRow
                            icon={<FiPhone />}
                            label={text.phone}
                            value={`+91 ${farmer.phone}`}
                        />
                        <ProfileRow
                            icon={<FiCreditCard />}
                            label={text.aadhaar}
                            value={farmer.aadhaarNumber ? `****${farmer.aadhaarNumber.slice(-4)}` : '-'}
                        />
                        <ProfileRow
                            icon="₹"
                            label={text.upiId}
                            value={farmer.upiId || '-'}
                        />
                    </div>

                    {!editing && (
                        <Button
                            variant="ghost"
                            onClick={() => setEditing(true)}
                            icon={<FiEdit2 />}
                            className="m-4"
                        >
                            {text.editProfile}
                        </Button>
                    )}
                </Card>

                {/* Edit Form */}
                {editing && (
                    <Card padding="lg" className="space-y-4">
                        <Input
                            label={text.name}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            icon={<FiUser />}
                        />
                        <Input
                            label={text.upiId}
                            value={editUpiId}
                            onChange={(e) => setEditUpiId(e.target.value)}
                            icon="₹"
                            placeholder="yourname@upi"
                        />
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditing(false);
                                    setEditName(farmer.name || '');
                                    setEditUpiId(farmer.upiId || '');
                                }}
                                fullWidth
                            >
                                {text.cancel}
                            </Button>
                            <Button onClick={handleSave} loading={saving} fullWidth>
                                {text.save}
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Language Setting */}
                <Card padding="none">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <FiGlobe className="text-gray-500" />
                            <span className="font-medium text-gray-700">{text.language}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleLanguageChange('hi')}
                                className={`
                  py-3 rounded-xl border-2 font-medium transition-all
                  ${locale === 'hi'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 text-gray-600'
                                    }
                `}
                            >
                                {text.hindi}
                            </button>
                            <button
                                onClick={() => handleLanguageChange('en')}
                                className={`
                  py-3 rounded-xl border-2 font-medium transition-all
                  ${locale === 'en'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 text-gray-600'
                                    }
                `}
                            >
                                {text.english}
                            </button>
                        </div>
                    </div>
                </Card>

                {/* Logout */}
                <Button variant="danger" onClick={handleLogout} icon={<FiLogOut />}>
                    {text.logout}
                </Button>

                {/* Version */}
                <p className="text-center text-gray-400 text-sm">
                    {text.version}: 1.0.0
                </p>
            </div>
        </div>
    );
}

function ProfileRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-4 p-4">
            <span className="text-gray-400 text-xl">{icon}</span>
            <div className="flex-1">
                <p className="text-sm text-gray-500">{label}</p>
                <p className="font-medium text-gray-800">{value}</p>
            </div>
        </div>
    );
}
