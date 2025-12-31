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
        selectCrop: 'फसल चुनें',
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
        selectCrop: 'Select Crop',
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

interface FarmPlot {
    _id: string;
    plotName: string;
    areaAcre: number;
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

const cropOptions = [
    { value: 'paddy', label: { hi: 'धान', en: 'Paddy (Rice)' } },
    { value: 'wheat', label: { hi: 'गेहूं', en: 'Wheat' } },
    { value: 'sugarcane', label: { hi: 'गन्ना', en: 'Sugarcane' } },
    { value: 'maize', label: { hi: 'मक्का', en: 'Maize' } },
    { value: 'cotton', label: { hi: 'कपास', en: 'Cotton' } },
];

function BookPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];
    const preselectedPlotId = searchParams.get('plotId'); // Changed from farmId

    const [step, setStep] = useState<'farm' | 'details' | 'success'>('farm');
    const [plots, setPlots] = useState<FarmPlot[]>([]);
    const [selectedPlot, setSelectedPlot] = useState<FarmPlot | null>(null);
    const [selectedCrop, setSelectedCrop] = useState('paddy');
    const [estimation, setEstimation] = useState<Estimation | null>(null);
    const [harvestDate, setHarvestDate] = useState('');
    const [pickupSlot, setPickupSlot] = useState<'morning' | 'afternoon'>('morning');
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [bookingId, setBookingId] = useState('');

    useEffect(() => {
        loadPlots();
    }, []);

    useEffect(() => {
        if (preselectedPlotId && plots.length > 0) {
            const plot = plots.find(f => f._id === preselectedPlotId);
            if (plot) {
                selectPlot(plot);
            }
        }
    }, [preselectedPlotId, plots]);

    const loadPlots = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push(`/${locale}/login`);
                return;
            }

            const res = await fetch(`/api/farm-plots`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setPlots(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load plots:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateEstimation = async (plot: FarmPlot, crop: string) => {
        try {
            const res = await fetch('/api/calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cropType: crop,
                    areaInAcres: plot.areaAcre, // Match API expectation
                }),
            });

            const data = await res.json();
            if (data.success) {
                setEstimation(data.data);
            }
        } catch (error) {
            console.error('Failed to get estimation:', error);
        }
    }

    const selectPlot = (plot: FarmPlot) => {
        setSelectedPlot(plot);
        // Default to paddy or keep previous selection? Reset to paddy is safer for new plot.
        setSelectedCrop('paddy');
        calculateEstimation(plot, 'paddy');
        setStep('details');
    };

    const handleCropChange = (crop: string) => {
        setSelectedCrop(crop);
        if (selectedPlot) {
            calculateEstimation(selectedPlot, crop);
        }
    };

    const handleBooking = async () => {
        if (!selectedPlot || !harvestDate) return;

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
                    farmId: selectedPlot._id, // API expects farmId, we map plot._id to it
                    harvestEndDate: harvestDate,
                    scheduledPickupDate: pickup.toISOString(),
                    cropType: selectedCrop,
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
        <div className="safe-area-top padding-bottom-safe">
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
            <div className="px-4 py-6 pb-24">
                {step === 'farm' && (
                    <>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            {text.selectFarm}
                        </h2>

                        {plots.length === 0 ? (
                            <Card padding="lg" className="text-center">
                                <div className="text-4xl mb-3">🏞️</div>
                                <p className="text-gray-500 mb-4">{text.noFarms}</p>
                                <Button onClick={() => router.push(`/${locale}/farm-plots`)}>
                                    {text.addFarm}
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {plots.map((plot) => (
                                    <div
                                        key={plot._id}
                                        onClick={() => selectPlot(plot)}
                                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform flex items-center gap-4"
                                    >
                                        <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                                            {/* Default icon since we don't know crop yet, usually paddy/wheat */}
                                            🌱
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{plot.plotName}</h3>
                                            <p className="text-sm text-gray-500">
                                                {plot.areaAcre.toFixed(2)} {text.acres}
                                            </p>
                                        </div>
                                        <FiChevronRight className="text-gray-400" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {step === 'details' && selectedPlot && (
                    <div className="space-y-6">
                        {/* Selected Farm */}
                        <Card padding="md">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                                    {cropIcons[selectedCrop] || '🌱'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800">{selectedPlot.plotName}</h3>
                                    <p className="text-sm text-gray-500">
                                        {selectedPlot.areaAcre.toFixed(2)} {text.acres}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setStep('farm');
                                        setSelectedPlot(null);
                                        setEstimation(null);
                                    }}
                                    className="text-green-600 text-sm font-medium"
                                >
                                    {locale === 'hi' ? 'बदलें' : 'Change'}
                                </button>
                            </div>
                        </Card>

                        {/* Crop Selector */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {text.selectCrop}
                            </label>
                            <div className="flex gap-2 overflow-x-auto pb-2 noscroll">
                                {cropOptions.map((crop) => (
                                    <button
                                        key={crop.value}
                                        onClick={() => handleCropChange(crop.value)}
                                        className={`
                                            flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-colors
                                            ${selectedCrop === crop.value
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {crop.label[locale] || crop.label.en}
                                    </button>
                                ))}
                            </div>
                        </div>

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
