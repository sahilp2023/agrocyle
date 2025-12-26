'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { FiCheck, FiChevronRight, FiCalendar } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        title: 'पिकअप बुक करें',
        selectFarm: 'खेत चुनें',
        estimation: 'अनुमानित पराली',
        tonnes: 'टन',
        estimatedEarning: 'अनुमानित कमाई',
        harvestDate: 'फसल कटाई की तारीख',
        selectDate: 'तारीख चुनें',
        pickupSlot: 'पिकअप समय चुनें',
        morning: 'सुबह (6 AM - 12 PM)',
        afternoon: 'दोपहर (12 PM - 6 PM)',
        confirmBooking: 'बुकिंग पक्की करें',
        bookingSuccess: 'बुकिंग हो गई!',
        bookingId: 'बुकिंग आईडी',
        viewBookings: 'बुकिंग देखें',
        goHome: 'होम जाएं',
        noFarms: 'पहले खेत जोड़ें',
        addFarm: 'खेत जोड़ें',
        priceNote: 'अंतिम राशि तुलाई के बाद तय होगी',
        acres: 'एकड़',
    },
    en: {
        title: 'Book Pickup',
        selectFarm: 'Select Farm',
        estimation: 'Estimated Stubble',
        tonnes: 'tonnes',
        estimatedEarning: 'Estimated Earning',
        harvestDate: 'Harvest End Date',
        selectDate: 'Select date',
        pickupSlot: 'Select Pickup Slot',
        morning: 'Morning (6 AM - 12 PM)',
        afternoon: 'Afternoon (12 PM - 6 PM)',
        confirmBooking: 'Confirm Booking',
        bookingSuccess: 'Booking Confirmed!',
        bookingId: 'Booking ID',
        viewBookings: 'View Bookings',
        goHome: 'Go Home',
        noFarms: 'Add a farm first',
        addFarm: 'Add Farm',
        priceNote: 'Final amount will be determined after weighing',
        acres: 'acres',
    },
};

interface Farm {
    _id: string;
    name: string;
    cropType: string;
    areaInAcres: number;
}

interface Estimation {
    estimatedTonnes: number;
    estimatedPrice: number;
    pricePerTonne: number;
}

const cropIcons: Record<string, string> = {
    paddy: '🌾',
    wheat: '🌿',
    sugarcane: '🎋',
    maize: '🌽',
    cotton: '☁️',
    other: '🌱',
};

function BookPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];
    const preselectedFarmId = searchParams.get('farmId');

    const [step, setStep] = useState<'farm' | 'details' | 'success'>('farm');
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
    const [estimation, setEstimation] = useState<Estimation | null>(null);
    const [harvestDate, setHarvestDate] = useState('');
    const [pickupSlot, setPickupSlot] = useState<'morning' | 'afternoon'>('morning');
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [bookingId, setBookingId] = useState('');

    useEffect(() => {
        loadFarms();
    }, []);

    useEffect(() => {
        if (preselectedFarmId && farms.length > 0) {
            const farm = farms.find(f => f._id === preselectedFarmId);
            if (farm) {
                selectFarm(farm);
            }
        }
    }, [preselectedFarmId, farms]);

    const loadFarms = async () => {
        try {
            const token = localStorage.getItem('token');
            const farmerData = localStorage.getItem('farmer');

            if (!token || !farmerData) {
                router.push(`/${locale}/login`);
                return;
            }

            const farmer = JSON.parse(farmerData);
            const res = await fetch(`/api/farms?farmerId=${farmer.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setFarms(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load farms:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectFarm = async (farm: Farm) => {
        setSelectedFarm(farm);

        // Get estimation
        try {
            const res = await fetch('/api/calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cropType: farm.cropType,
                    areaInAcres: farm.areaInAcres,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setEstimation(data.data);
            }
        } catch (error) {
            console.error('Failed to get estimation:', error);
        }

        setStep('details');
    };

    const handleBooking = async () => {
        if (!selectedFarm || !harvestDate) return;

        setBooking(true);

        try {
            const token = localStorage.getItem('token');

            // Calculate pickup date (2 days after harvest)
            const harvest = new Date(harvestDate);
            const pickup = new Date(harvest);
            pickup.setDate(pickup.getDate() + 2);
            if (pickupSlot === 'afternoon') {
                pickup.setHours(14, 0, 0, 0);
            } else {
                pickup.setHours(8, 0, 0, 0);
            }

            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    farmId: selectedFarm._id,
                    harvestEndDate: harvestDate,
                    scheduledPickupDate: pickup.toISOString(),
                }),
            });

            const data = await res.json();

            if (data.success) {
                setBookingId(data.data._id);
                setStep('success');
            }
        } catch (error) {
            console.error('Failed to create booking:', error);
        } finally {
            setBooking(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Get minimum date (today)
    const today = new Date().toISOString().split('T')[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        );
    }

    // Success State
    if (step === 'success') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-600 to-green-700 flex flex-col items-center justify-center px-6 safe-area-top safe-area-bottom">
                <div className="text-center">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FiCheck className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {text.bookingSuccess}
                    </h1>
                    <p className="text-green-100 mb-2">{text.bookingId}</p>
                    <p className="text-white font-mono text-lg mb-8">
                        #{bookingId.slice(-8).toUpperCase()}
                    </p>

                    {estimation && (
                        <div className="bg-white/20 backdrop-blur rounded-2xl p-6 mb-8">
                            <p className="text-green-100">{text.estimatedEarning}</p>
                            <p className="text-4xl font-bold text-white">
                                {formatCurrency(estimation.estimatedPrice)}
                            </p>
                            <p className="text-green-100 text-sm mt-2">{text.priceNote}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button
                            variant="secondary"
                            onClick={() => router.push(`/${locale}/bookings`)}
                        >
                            {text.viewBookings}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push(`/${locale}/dashboard`)}
                            className="border-white/50 text-white hover:bg-white/10"
                        >
                            {text.goHome}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="safe-area-top">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 rounded-b-3xl">
                <h1 className="text-2xl font-bold text-white">{text.title}</h1>

                {/* Progress */}
                <div className="flex items-center gap-2 mt-4">
                    <div className={`flex-1 h-1 rounded ${step === 'farm' ? 'bg-white' : 'bg-white/30'}`} />
                    <div className={`flex-1 h-1 rounded ${step === 'details' ? 'bg-white' : 'bg-white/30'}`} />
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">
                {step === 'farm' && (
                    <>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {text.selectFarm}
                        </h2>

                        {farms.length === 0 ? (
                            <Card padding="lg" className="text-center">
                                <div className="text-4xl mb-3">🏞️</div>
                                <p className="text-gray-500 mb-4">{text.noFarms}</p>
                                <Button onClick={() => router.push(`/${locale}/farms`)}>
                                    {text.addFarm}
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {farms.map((farm) => (
                                    <Card
                                        key={farm._id}
                                        padding="md"
                                        interactive
                                        onClick={() => selectFarm(farm)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                                                {cropIcons[farm.cropType] || '🌱'}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">{farm.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {farm.areaInAcres} {text.acres}
                                                </p>
                                            </div>
                                            <FiChevronRight className="text-gray-400" />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {step === 'details' && selectedFarm && (
                    <div className="space-y-6">
                        {/* Selected Farm */}
                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                                    {cropIcons[selectedFarm.cropType] || '🌱'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{selectedFarm.name}</h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedFarm.areaInAcres} {text.acres}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setStep('farm');
                                        setSelectedFarm(null);
                                        setEstimation(null);
                                    }}
                                    className="text-green-600 text-sm font-medium"
                                >
                                    {locale === 'hi' ? 'बदलें' : 'Change'}
                                </button>
                            </div>
                        </Card>

                        {/* Estimation */}
                        {estimation && (
                            <Card padding="lg" className="bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200">
                                <div className="text-center">
                                    <p className="text-amber-700 font-medium">{text.estimation}</p>
                                    <p className="text-3xl font-bold text-amber-800 my-2">
                                        {estimation.estimatedTonnes} {text.tonnes}
                                    </p>
                                    <div className="border-t border-amber-200 pt-4 mt-4">
                                        <p className="text-amber-700">{text.estimatedEarning}</p>
                                        <p className="text-4xl font-bold text-green-600">
                                            {formatCurrency(estimation.estimatedPrice)}
                                        </p>
                                        <p className="text-xs text-amber-600 mt-2">{text.priceNote}</p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Harvest Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {text.harvestDate}
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    min={today}
                                    value={harvestDate}
                                    onChange={(e) => setHarvestDate(e.target.value)}
                                    className="
                    w-full pl-12 pr-4 py-4
                    text-lg rounded-xl border-2 border-gray-200
                    focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/20
                  "
                                />
                            </div>
                        </div>

                        {/* Pickup Slot */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {text.pickupSlot}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPickupSlot('morning')}
                                    className={`
                    p-4 rounded-xl border-2 text-center
                    transition-all
                    ${pickupSlot === 'morning'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 text-gray-600'
                                        }
                  `}
                                >
                                    <span className="text-2xl block mb-1">🌅</span>
                                    <span className="text-sm font-medium">{text.morning}</span>
                                </button>
                                <button
                                    onClick={() => setPickupSlot('afternoon')}
                                    className={`
                    p-4 rounded-xl border-2 text-center
                    transition-all
                    ${pickupSlot === 'afternoon'
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-200 text-gray-600'
                                        }
                  `}
                                >
                                    <span className="text-2xl block mb-1">☀️</span>
                                    <span className="text-sm font-medium">{text.afternoon}</span>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Button */}
                        <Button
                            onClick={handleBooking}
                            loading={booking}
                            disabled={!harvestDate}
                            icon="🚜"
                        >
                            {text.confirmBooking}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function BookPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        }>
            <BookPageContent />
        </Suspense>
    );
}
