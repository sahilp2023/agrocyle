'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, StatusCard } from '@/components/ui';
import { FiPlus, FiTrendingUp } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        greeting: 'नमस्ते',
        dashboard: 'मेरा खेत',
        totalEarnings: 'कुल कमाई',
        activeBookings: 'चालू बुकिंग',
        completedPickups: 'पूर्ण पिकअप',
        myFarms: 'मेरे खेत',
        noFarms: 'अभी तक कोई खेत नहीं जोड़ा',
        addFirstFarm: 'अपना पहला खेत जोड़ें',
        bookPickup: 'पिकअप बुक करें',
        recentBookings: 'हाल की बुकिंग',
        noBookings: 'अभी कोई बुकिंग नहीं',
        viewAll: 'सभी देखें',
        acres: 'एकड़',
    },
    en: {
        greeting: 'Hello',
        dashboard: 'My Farm',
        totalEarnings: 'Total Earnings',
        activeBookings: 'Active Bookings',
        completedPickups: 'Completed Pickups',
        myFarms: 'My Farms',
        noFarms: 'No farms added yet',
        addFirstFarm: 'Add your first farm',
        bookPickup: 'Book Pickup',
        recentBookings: 'Recent Bookings',
        noBookings: 'No bookings yet',
        viewAll: 'View All',
        acres: 'acres',
    },
};

interface Farm {
    _id: string;
    name: string;
    cropType: string;
    areaInAcres: number;
}

interface Booking {
    _id: string;
    status: 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    estimatedPrice: number;
    finalPrice?: number;
    createdAt: string;
    farmId: {
        name: string;
        cropType: string;
    };
}

const cropIcons: Record<string, string> = {
    paddy: '🌾',
    wheat: '🌿',
    sugarcane: '🎋',
    maize: '🌽',
    cotton: '☁️',
    other: '🌱',
};

export default function DashboardPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [farmerName, setFarmerName] = useState('');
    const [farms, setFarms] = useState<Farm[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [stats, setStats] = useState({ earnings: 0, active: 0, completed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const farmerData = localStorage.getItem('farmer');

        if (!token) {
            router.push(`/${locale}/login`);
            return;
        }

        if (farmerData) {
            const farmer = JSON.parse(farmerData);
            setFarmerName(farmer.name || '');
        }

        loadData(token);
    }, [locale, router]);

    const loadData = async (token: string) => {
        try {
            const farmerData = localStorage.getItem('farmer');
            if (!farmerData) return;
            const farmer = JSON.parse(farmerData);

            // Fetch farms
            const farmsRes = await fetch(`/api/farms?farmerId=${farmer.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const farmsData = await farmsRes.json();
            if (farmsData.success) {
                setFarms(farmsData.data || []);
            }

            // Fetch bookings
            const bookingsRes = await fetch(`/api/bookings?farmerId=${farmer.id}&limit=5`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const bookingsData = await bookingsRes.json();
            if (bookingsData.success) {
                setBookings(bookingsData.data || []);

                // Calculate stats
                const allBookings = bookingsData.data || [];
                const completed = allBookings.filter((b: Booking) => b.status === 'completed');
                const active = allBookings.filter((b: Booking) =>
                    ['pending', 'confirmed', 'scheduled', 'in_progress'].includes(b.status)
                );
                const earnings = completed.reduce((sum: number, b: Booking) =>
                    sum + (b.finalPrice || b.estimatedPrice || 0), 0
                );

                setStats({
                    earnings,
                    active: active.length,
                    completed: completed.length,
                });
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        );
    }

    return (
        <div className="safe-area-top">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 rounded-b-3xl">
                <p className="text-green-100">
                    {text.greeting}, {farmerName || (locale === 'hi' ? 'किसान' : 'Farmer')} 👋
                </p>
                <h1 className="text-2xl font-bold text-white">{text.dashboard}</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-green-100 text-xs">{text.totalEarnings}</p>
                        <p className="text-white font-bold text-lg">
                            {formatCurrency(stats.earnings)}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-green-100 text-xs">{text.activeBookings}</p>
                        <p className="text-white font-bold text-lg">{stats.active}</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                        <p className="text-green-100 text-xs">{text.completedPickups}</p>
                        <p className="text-white font-bold text-lg">{stats.completed}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6 space-y-6">
                {/* My Farms Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">{text.myFarms}</h2>
                        <button
                            onClick={() => router.push(`/${locale}/farms`)}
                            className="text-green-600 text-sm font-medium"
                        >
                            {text.viewAll}
                        </button>
                    </div>

                    {farms.length === 0 ? (
                        <Card padding="lg" className="text-center">
                            <div className="text-4xl mb-3">🏞️</div>
                            <p className="text-gray-500 mb-4">{text.noFarms}</p>
                            <Button
                                onClick={() => router.push(`/${locale}/farms`)}
                                icon={<FiPlus />}
                                size="md"
                            >
                                {text.addFirstFarm}
                            </Button>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {farms.slice(0, 3).map((farm) => (
                                <Card
                                    key={farm._id}
                                    padding="md"
                                    interactive
                                    onClick={() => router.push(`/${locale}/book?farmId=${farm._id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                                            {cropIcons[farm.cropType] || '🌱'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{farm.name}</h3>
                                            <p className="text-sm text-gray-500">
                                                {farm.areaInAcres} {text.acres}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            fullWidth={false}
                                            icon="🚜"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/${locale}/book?farmId=${farm._id}`);
                                            }}
                                        >
                                            {text.bookPickup}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>

                {/* Recent Bookings Section */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">{text.recentBookings}</h2>
                        <button
                            onClick={() => router.push(`/${locale}/bookings`)}
                            className="text-green-600 text-sm font-medium"
                        >
                            {text.viewAll}
                        </button>
                    </div>

                    {bookings.length === 0 ? (
                        <Card padding="lg" className="text-center">
                            <div className="text-4xl mb-3">📋</div>
                            <p className="text-gray-500">{text.noBookings}</p>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {bookings.map((booking) => (
                                <StatusCard
                                    key={booking._id}
                                    status={booking.status}
                                    title={booking.farmId?.name || 'Farm'}
                                    bookingId={booking._id}
                                    estimatedAmount={formatCurrency(booking.estimatedPrice)}
                                    amount={booking.finalPrice ? formatCurrency(booking.finalPrice) : undefined}
                                    onClick={() => router.push(`/${locale}/bookings`)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Quick Book Button */}
                {farms.length > 0 && (
                    <div className="fixed bottom-24 right-4">
                        <button
                            onClick={() => router.push(`/${locale}/book`)}
                            className="
                w-14 h-14 rounded-full
                bg-gradient-to-r from-amber-500 to-amber-600
                text-white text-2xl
                shadow-lg shadow-amber-500/40
                flex items-center justify-center
                hover:scale-105 active:scale-95
                transition-transform
              "
                        >
                            🚜
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
