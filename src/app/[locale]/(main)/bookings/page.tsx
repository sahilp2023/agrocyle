'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { StatusCard, Card, Button } from '@/components/ui';
import { FiX, FiCalendar } from 'react-icons/fi';

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
        cancelConfirm: 'क्या आप बुकिंग रद्द करना चाहते हैं?',
        rescheduleTitle: 'पिकअप की तारीख बदलें',
        selectDate: 'नई तारीख चुनें',
        update: 'अपडेट करें',
        cancel: 'रद्द करें',
        yesCancel: 'हां, रद्द करें',
        noKeep: 'नहीं, रहने दें',
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
        cancelConfirm: 'Are you sure you want to cancel?',
        rescheduleTitle: 'Reschedule Pickup',
        selectDate: 'Select new date',
        update: 'Update',
        cancel: 'Cancel',
        yesCancel: 'Yes, Cancel',
        noKeep: 'No, Keep it',
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
    cropType: string;
    farmId: {
        plotName: string;
        areaAcre: number;
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

    // Modal state
    const [rescheduleData, setRescheduleData] = useState<{ id: string, date: string } | null>(null);
    const [cancelId, setCancelId] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

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

    const handleCancelBooking = async () => {
        if (!cancelId) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookingId: cancelId,
                    status: 'cancelled',
                    cancellationReason: 'Cancelled by farmer'
                })
            });
            const data = await res.json();
            if (data.success) {
                await loadBookings();
                setCancelId(null);
            }
        } catch (error) {
            console.error('Cancel failed', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReschedule = async () => {
        if (!rescheduleData) return;
        setProcessing(true);
        try {
            const token = localStorage.getItem('token');
            // Logic to calculate pickup date from harvest date usually +2 days,
            // but here we are allowing explicit date selection for pickup?
            // The UI allows picking a date. Let's assume user picks pickup date.

            const res = await fetch('/api/bookings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    bookingId: rescheduleData.id,
                    scheduledPickupDate: new Date(rescheduleData.date).toISOString()
                })
            });
            const data = await res.json();
            if (data.success) {
                await loadBookings();
                setRescheduleData(null);
            }
        } catch (error) {
            console.error('Reschedule failed', error);
        } finally {
            setProcessing(false);
        }
    }

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
    const today = new Date().toISOString().split('T')[0];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        );
    }

    return (
        <div className="safe-area-top min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 rounded-b-3xl shadow-md">
                <h1 className="text-2xl font-bold text-white">{text.title}</h1>

                {/* Tabs */}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setTab('active')}
                        className={`
              flex-1 py-2 px-4 rounded-xl font-medium transition-all
              ${tab === 'active'
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'bg-white/20 text-white hover:bg-white/30'
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
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'bg-white/20 text-white hover:bg-white/30'
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
                    <div className="flex flex-col items-center justify-center pt-10 opacity-60">
                        <div className="text-6xl mb-4 grayscale">🚜</div>
                        <p className="text-gray-500 font-medium mb-4">{text.noBookings}</p>
                        <button
                            onClick={() => router.push(`/${locale}/book`)}
                            className="bg-green-600 text-white px-6 py-2 rounded-full font-semibold shadow-md active:scale-95 transition-all"
                        >
                            {text.startBooking}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayBookings.map((booking) => (
                            <StatusCard
                                key={booking._id}
                                status={booking.status}
                                title={booking.farmId?.plotName || 'Farm Plot'}
                                subtitle={`${booking.estimatedStubbleTonnes} ${locale === 'hi' ? 'टन' : 'tonnes'} • ${booking.cropType}`}
                                bookingId={booking._id}
                                date={formatDate(booking.scheduledPickupDate || booking.harvestEndDate)}
                                estimatedAmount={formatCurrency(booking.estimatedPrice)}
                                amount={booking.finalPrice ? formatCurrency(booking.finalPrice) : undefined}
                                onEdit={() => setRescheduleData({ id: booking._id, date: (booking.scheduledPickupDate || booking.harvestEndDate).split('T')[0] })}
                                onCancel={() => setCancelId(booking._id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            {cancelId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{text.cancelConfirm}</h3>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setCancelId(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
                            >
                                {text.noKeep}
                            </button>
                            <button
                                onClick={handleCancelBooking}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
                            >
                                {processing ? '...' : text.yesCancel}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {rescheduleData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{text.rescheduleTitle}</h3>
                            <button onClick={() => setRescheduleData(null)} className="p-2 bg-gray-100 rounded-full text-gray-600">
                                <FiX />
                            </button>
                        </div>

                        <label className="block text-sm font-medium text-gray-600 mb-2">{text.selectDate}</label>
                        <input
                            type="date"
                            min={today}
                            value={rescheduleData.date}
                            onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-green-500 outline-none text-lg mb-6"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRescheduleData(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
                            >
                                {text.cancel}
                            </button>
                            <button
                                onClick={handleReschedule}
                                disabled={processing}
                                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700"
                            >
                                {processing ? '...' : text.update}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
