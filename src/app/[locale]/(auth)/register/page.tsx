'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { FiUser, FiCreditCard, FiMapPin, FiCheck, FiHome } from 'react-icons/fi';

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
        pincode: 'पिनकोड',
        pincodePlaceholder: '6 अंकों का पिनकोड',
        village: 'गाँव / मोहल्ला',
        villagePlaceholder: 'अपने गाँव का नाम',
        city: 'शहर / जिला',
        cityPlaceholder: 'शहर का नाम',
        state: 'राज्य',
        statePlaceholder: 'राज्य का नाम',
        submit: 'पंजीकरण पूरा करें',
        skip: 'बाद में करें',
        success: 'प्रोफाइल सेव हो गई!',
        error: 'कुछ गलत हुआ। पुन: प्रयास करें।',
        locationSection: 'पता विवरण',
        lookingUp: 'खोज रहे हैं...',
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
        pincode: 'Pincode',
        pincodePlaceholder: '6-digit pincode',
        village: 'Village / Locality',
        villagePlaceholder: 'Your village name',
        city: 'City / District',
        cityPlaceholder: 'City name',
        state: 'State',
        statePlaceholder: 'State name',
        submit: 'Complete Registration',
        skip: 'Do it later',
        success: 'Profile saved!',
        error: 'Something went wrong. Please try again.',
        locationSection: 'Address Details',
        lookingUp: 'Looking up...',
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
    const [pincode, setPincode] = useState('');
    const [village, setVillage] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [lookingUpPincode, setLookingUpPincode] = useState(false);

    useEffect(() => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            router.push(`/${locale}/login`);
        }
    }, [locale, router]);

    const lookupPincode = async (code: string) => {
        if (code.length !== 6) return;

        setLookingUpPincode(true);
        try {
            const res = await fetch(`/api/pincode?code=${code}`);
            const data = await res.json();

            if (data.success) {
                setCity(data.data.city || '');
                setState(data.data.state || '');
            }
        } catch (err) {
            console.error('Pincode lookup failed:', err);
        } finally {
            setLookingUpPincode(false);
        }
    };

    const handlePincodeChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 6);
        setPincode(cleaned);

        if (cleaned.length === 6) {
            lookupPincode(cleaned);
        }
    };

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
                    pincode: pincode || undefined,
                    village: village.trim() || undefined,
                    city: city.trim() || undefined,
                    state: state.trim() || undefined,
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
            <div className="px-4 py-6 -mt-4 pb-24">
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

                    {/* Location Section Divider */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <FiHome className="text-green-600" />
                            {text.locationSection}
                        </h3>

                        {/* Pincode */}
                        <div className="mb-4">
                            <Input
                                label={text.pincode}
                                icon={<FiMapPin />}
                                placeholder={text.pincodePlaceholder}
                                value={pincode}
                                onChange={(e) => handlePincodeChange(e.target.value)}
                                inputMode="numeric"
                                maxLength={6}
                            />
                            {lookingUpPincode && (
                                <p className="text-xs text-green-600 mt-1 animate-pulse">{text.lookingUp}</p>
                            )}
                        </div>

                        {/* Village */}
                        <div className="mb-4">
                            <Input
                                label={text.village}
                                placeholder={text.villagePlaceholder}
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                            />
                        </div>

                        {/* City & State in Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                label={text.city}
                                placeholder={text.cityPlaceholder}
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                            <Input
                                label={text.state}
                                placeholder={text.statePlaceholder}
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Optional GPS Location Detection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {locale === 'hi' ? 'GPS स्थान (वैकल्पिक)' : 'GPS Location (Optional)'}
                        </label>
                        <button
                            type="button"
                            onClick={detectLocation}
                            disabled={detectingLocation}
                            className={`
                w-full flex items-center justify-center gap-3
                p-3 rounded-xl border-2 border-dashed
                transition-all duration-200 text-sm
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
