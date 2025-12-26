'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui';
import { FiCheck, FiClock, FiDownload } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        title: 'मेरे भुगतान',
        history: 'भुगतान इतिहास',
        pending: 'बाकी भुगतान',
        received: 'प्राप्त राशि',
        totalEarnings: 'कुल कमाई',
        noPayments: 'अभी कोई भुगतान नहीं',
        startBooking: 'पहले पिकअप बुक करें',
        transactionId: 'लेनदेन आईडी',
        paidOn: 'भुगतान तिथि',
        status: {
            pending: 'बाकी',
            processing: 'प्रोसेसिंग',
            completed: 'पूर्ण',
            failed: 'विफल',
        },
    },
    en: {
        title: 'My Payments',
        history: 'Payment History',
        pending: 'Pending Payments',
        received: 'Amount Received',
        totalEarnings: 'Total Earnings',
        noPayments: 'No payments yet',
        startBooking: 'Book a pickup first',
        transactionId: 'Transaction ID',
        paidOn: 'Paid on',
        status: {
            pending: 'Pending',
            processing: 'Processing',
            completed: 'Completed',
            failed: 'Failed',
        },
    },
};

interface Payment {
    _id: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    transactionId?: string;
    paidAt?: string;
    createdAt: string;
    bookingId: {
        farmId: {
            name: string;
            cropType: string;
        };
    };
}

const statusIcons: Record<string, React.ReactNode> = {
    pending: <FiClock className="text-amber-500" />,
    processing: <FiClock className="text-blue-500 animate-spin" />,
    completed: <FiCheck className="text-green-500" />,
    failed: <span className="text-red-500">✕</span>,
};

const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 border-amber-200',
    processing: 'bg-blue-50 border-blue-200',
    completed: 'bg-green-50 border-green-200',
    failed: 'bg-red-50 border-red-200',
};

export default function PaymentsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, pending: 0 });

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const farmerData = localStorage.getItem('farmer');

            if (!token || !farmerData) {
                router.push(`/${locale}/login`);
                return;
            }

            const farmer = JSON.parse(farmerData);
            const res = await fetch(`/api/payments?farmerId=${farmer.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                const paymentsList = data.data || [];
                setPayments(paymentsList);

                // Calculate stats
                const completed = paymentsList
                    .filter((p: Payment) => p.status === 'completed')
                    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

                const pending = paymentsList
                    .filter((p: Payment) => p.status === 'pending' || p.status === 'processing')
                    .reduce((sum: number, p: Payment) => sum + p.amount, 0);

                setStats({ total: completed, pending });
            }
        } catch (error) {
            console.error('Failed to load payments:', error);
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

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                        <p className="text-green-100 text-sm">{text.totalEarnings}</p>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(stats.total)}
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                        <p className="text-green-100 text-sm">{text.pending}</p>
                        <p className="text-2xl font-bold text-white">
                            {formatCurrency(stats.pending)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    {text.history}
                </h2>

                {payments.length === 0 ? (
                    <Card padding="lg" className="text-center">
                        <div className="text-6xl mb-4">💰</div>
                        <p className="text-gray-500 mb-4">{text.noPayments}</p>
                        <button
                            onClick={() => router.push(`/${locale}/book`)}
                            className="text-green-600 font-semibold"
                        >
                            {text.startBooking}
                        </button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <Card
                                key={payment._id}
                                padding="md"
                                className={`border-2 ${statusColors[payment.status]}`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">
                                        {statusIcons[payment.status]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-gray-800">
                                                {payment.bookingId?.farmId?.name || 'Farm'}
                                            </h3>
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {text.status[payment.status]}
                                        </p>
                                        {payment.paidAt && (
                                            <p className="text-xs text-gray-400 mt-2">
                                                {text.paidOn}: {formatDate(payment.paidAt)}
                                            </p>
                                        )}
                                        {payment.transactionId && (
                                            <p className="text-xs text-gray-400">
                                                {text.transactionId}: {payment.transactionId}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
