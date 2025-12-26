'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { FiUser, FiCreditCard, FiMapPin, FiCheck } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        title: 'अपनी प्रोफाइल पूरी करें',
        subtitle: 'शुरू करने के लिए अपनी जानकारी दें',
        name: 'आपका नाम',
        namePlaceholder: 'अपना पूरा नाम लिखें',
        aadhaar: 'आधार नंबर',
        aadhaarPlaceholder: '12 अंकों का आधार नंबर',
        upiId: 'UPI ID (भुगतान के लिए)',
        upiPlaceholder: 'yourname@upi',
        submit: 'पंजीकरण पूरा करें',
        skip: 'बाद में करें',
        success: 'प्रोफाइल सेव हो गई!',
        error: 'कुछ गलत हुआ। पुन: प्रयास करें।',
    },
    en: {
        title: 'Complete Your Profile',
        subtitle: 'Enter your details to get started',
        name: 'Your Name',
        namePlaceholder: 'Enter your full name',
        aadhaar: 'Aadhaar Number',
        aadhaarPlaceholder: '12-digit Aadhaar number',
        upiId: 'UPI ID (for payments)',
        upiPlaceholder: 'yourname@upi',
        submit: 'Complete Registration',
        skip: 'Do it later',
        success: 'Profile saved!',
        error: 'Something went wrong. Please try again.',
    },
};

export default function RegisterPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [name, setName] = useState('');
    const [aadhaar, setAadhaar] = useState('');
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            router.push(`/${locale}/login`);
        }
    }, [locale, router]);

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported');
            return;
        }

        setDetectingLocation(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setDetectingLocation(false);
            },
            () => {
                setDetectingLocation(false);
                alert(locale === 'hi' ? 'स्थान नहीं मिला' : 'Could not detect location');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setError(locale === 'hi' ? 'नाम आवश्यक है' : 'Name is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            const res = await fetch('/api/farmers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: name.trim(),
                    aadhaarNumber: aadhaar.replace(/\D/g, ''),
                    upiId: upiId.trim(),
                    language: locale,
                    location: location ? {
                        type: 'Point',
                        coordinates: [location.lng, location.lat],
                    } : undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Update stored farmer data
                localStorage.setItem('farmer', JSON.stringify(data.data));
                router.push(`/${locale}/dashboard`);
            } else {
                setError(data.error || text.error);
            }
        } catch {
            setError(text.error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen-safe bg-gray-50 safe-area-top safe-area-bottom">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8 rounded-b-3xl">
                <h1 className="text-2xl font-bold text-white">{text.title}</h1>
                <p className="text-green-100 mt-1">{text.subtitle}</p>
            </div>

            {/* Form */}
            <div className="px-4 py-6 -mt-4">
                <Card padding="lg" className="space-y-5">
                    {/* Name */}
                    <Input
                        label={text.name}
                        icon={<FiUser />}
                        placeholder={text.namePlaceholder}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {/* Aadhaar */}
                    <Input
                        label={text.aadhaar}
                        icon={<FiCreditCard />}
                        placeholder={text.aadhaarPlaceholder}
                        value={aadhaar}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                            setAadhaar(value);
                        }}
                        inputMode="numeric"
                        maxLength={12}
                    />

                    {/* UPI ID */}
                    <Input
                        label={text.upiId}
                        icon="₹"
                        placeholder={text.upiPlaceholder}
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                    />

                    {/* Location Detection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'hi' ? 'आपका स्थान' : 'Your Location'}
                        </label>
                        <button
                            type="button"
                            onClick={detectLocation}
                            disabled={detectingLocation}
                            className={`
                w-full flex items-center justify-center gap-3
                p-4 rounded-xl border-2 border-dashed
                transition-all duration-200
                ${location
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-300 bg-white text-gray-600 hover:border-green-400'
                                }
              `}
                        >
                            {detectingLocation ? (
                                <span className="animate-spin">⏳</span>
                            ) : location ? (
                                <FiCheck className="text-green-600" />
                            ) : (
                                <FiMapPin />
                            )}
                            <span className="font-medium">
                                {detectingLocation
                                    ? (locale === 'hi' ? 'खोज रहे हैं...' : 'Detecting...')
                                    : location
                                        ? (locale === 'hi' ? 'स्थान मिल गया ✓' : 'Location detected ✓')
                                        : (locale === 'hi' ? 'मेरा स्थान पता लगाएं' : 'Detect my location')
                                }
                            </span>
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-500 text-center text-sm">{error}</p>
                    )}
                </Card>

                {/* Submit Button */}
                <div className="mt-6 space-y-3">
                    <Button onClick={handleSubmit} loading={loading} icon="✅">
                        {text.submit}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/${locale}/dashboard`)}
                    >
                        {text.skip}
                    </Button>
                </div>
            </div>
        </div>
    );
}
