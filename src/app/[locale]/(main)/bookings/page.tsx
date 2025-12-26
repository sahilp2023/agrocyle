'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StatusCard, Card } from '@/components/ui';

// Translations
const t = {
    hi: {
        title: 'मेरी बुकिंग',
        active: 'चालू',
        completed: 'पूर्ण',
        noBookings: 'अभी कोई बुकिंग नहीं',
        startBooking: 'पहली पिकअप बुक करें',
        status: {
            pending: 'बाकी',
            confirmed: 'पुष्टि',
            scheduled: 'निर्धारित',
            in_progress: 'जारी है',
            completed: 'पूर्ण',
            cancelled: 'रद्द',
        },
    },
    en: {
        title: 'My Bookings',
        active: 'Active',
        completed: 'Completed',
        noBookings: 'No bookings yet',
        startBooking: 'Book your first pickup',
        status: {
            pending: 'Pending',
            confirmed: 'Confirmed',
            scheduled: 'Scheduled',
            in_progress: 'In Progress',
            completed: 'Completed',
            cancelled: 'Cancelled',
        },
    },
};

interface Booking {
    _id: string;
    status: 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    estimatedStubbleTonnes: number;
    actualStubbleTonnes?: number;
    estimatedPrice: number;
    finalPrice?: number;
    harvestEndDate: string;
    scheduledPickupDate?: string;
    createdAt: string;
    farmId: {
        name: string;
        cropType: string;
    };
}

export default function BookingsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'active' | 'completed'>('active');

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const token = localStorage.getItem('token');
            const farmerData = localStorage.getItem('farmer');

            if (!token || !farmerData) {
                router.push(`/${locale}/login`);
                return;
            }

            const farmer = JSON.parse(farmerData);
            const res = await fetch(`/api/bookings?farmerId=${farmer.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setBookings(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
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

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const activeBookings = bookings.filter(b =>
        ['pending', 'confirmed', 'scheduled', 'in_progress'].includes(b.status)
    );

    const completedBookings = bookings.filter(b =>
        ['completed', 'cancelled'].includes(b.status)
    );

    const displayBookings = tab === 'active' ? activeBookings : completedBookings;

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
                <h1 className="text-2xl font-bold text-white">{text.title}</h1>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setTab('active')}
                        className={`
              flex-1 py-2 px-4 rounded-xl font-medium transition-all
              ${tab === 'active'
                                ? 'bg-white text-green-700'
                                : 'bg-white/20 text-white'
                            }
            `}
                    >
                        {text.active} ({activeBookings.length})
                    </button>
                    <button
                        onClick={() => setTab('completed')}
                        className={`
              flex-1 py-2 px-4 rounded-xl font-medium transition-all
              ${tab === 'completed'
                                ? 'bg-white text-green-700'
                                : 'bg-white/20 text-white'
                            }
            `}
                    >
                        {text.completed} ({completedBookings.length})
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">
                {displayBookings.length === 0 ? (
                    <Card padding="lg" className="text-center">
                        <div className="text-6xl mb-4">📋</div>
                        <p className="text-gray-500 mb-4">{text.noBookings}</p>
                        <button
                            onClick={() => router.push(`/${locale}/book`)}
                            className="text-green-600 font-semibold"
                        >
                            {text.startBooking}
                        </button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {displayBookings.map((booking) => (
                            <StatusCard
                                key={booking._id}
                                status={booking.status}
                                title={booking.farmId?.name || 'Farm'}
                                subtitle={`${booking.estimatedStubbleTonnes} ${locale === 'hi' ? 'टन' : 'tonnes'}`}
                                bookingId={booking._id}
                                date={formatDate(booking.scheduledPickupDate || booking.harvestEndDate)}
                                estimatedAmount={formatCurrency(booking.estimatedPrice)}
                                amount={booking.finalPrice ? formatCurrency(booking.finalPrice) : undefined}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
