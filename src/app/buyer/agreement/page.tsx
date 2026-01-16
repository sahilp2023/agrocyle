'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiCheck, FiFileText } from 'react-icons/fi';

export default function BuyerAgreementPage() {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        const pendingEmail = localStorage.getItem('pendingBuyerEmail');
        if (pendingEmail) {
            setEmail(pendingEmail);
        }
    }, []);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
            // Check if scrolled to bottom (with some tolerance)
            if (scrollTop + clientHeight >= scrollHeight - 50) {
                setHasScrolledToBottom(true);
            }
        }
    };

    const handleAcceptAgreement = async () => {
        if (!email) {
            setError('Session expired. Please register again.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/buyer/auth/accept-agreement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.removeItem('pendingBuyerEmail');
                router.push('/buyer/login');
            } else {
                setError(data.error || 'Failed to accept agreement');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/buyer/register')}
                    className="flex items-center gap-2 text-emerald-200 hover:text-white mb-6 transition-colors"
                >
                    <FiArrowLeft />
                    <span>Back to Registration</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4">
                        <FiFileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Buyer Agreement</h1>
                    <p className="text-emerald-200 mt-2">Please read and accept the agreement to continue</p>
                </div>

                {/* Agreement Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Progress indicator */}
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-700 font-medium">
                                {hasScrolledToBottom ? '✓ Agreement reviewed' : 'Scroll to read the full agreement'}
                            </span>
                            <span className={`text-xs px-3 py-1 rounded-full ${hasScrolledToBottom
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                {hasScrolledToBottom ? 'Ready to accept' : 'Scroll down'}
                            </span>
                        </div>
                    </div>

                    {/* Agreement Content */}
                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="h-96 overflow-y-auto p-6 md:p-8 text-gray-700 scroll-smooth"
                    >
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            AGROCYCLE BUYER SERVICES AGREEMENT
                        </h2>

                        <p className="mb-4 text-sm text-gray-500">
                            Last Updated: January 2026
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">1. INTRODUCTION</h3>
                        <p className="mb-4">
                            This Buyer Services Agreement (&quot;Agreement&quot;) is entered into between AgroCycle Technologies Private Limited
                            (&quot;AgroCycle&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) and the registered buyer company (&quot;Buyer&quot;, &quot;you&quot;, or &quot;your&quot;)
                            as identified in the registration form.
                        </p>
                        <p className="mb-4">
                            By accepting this Agreement, you acknowledge that you have read, understood, and agree to be bound
                            by these terms and conditions governing the purchase and delivery of agricultural stubble and biomass
                            materials through the AgroCycle platform.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">2. DEFINITIONS</h3>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li><strong>&quot;Platform&quot;</strong> refers to the AgroCycle web and mobile applications.</li>
                            <li><strong>&quot;Stubble&quot;</strong> refers to agricultural residue including but not limited to paddy straw, wheat straw, and other crop residues.</li>
                            <li><strong>&quot;Hub&quot;</strong> refers to AgroCycle collection and processing centers.</li>
                            <li><strong>&quot;Delivery&quot;</strong> refers to the transportation of stubble from Hub to Buyer&apos;s facility.</li>
                            <li><strong>&quot;Order&quot;</strong> refers to a request placed by Buyer for stubble quantity.</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3. SERVICES PROVIDED</h3>
                        <p className="mb-4">
                            AgroCycle agrees to provide the following services to the Buyer:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Supply of agricultural stubble as per the agreed specifications</li>
                            <li>Quality assurance and moisture content verification</li>
                            <li>Baling and packaging as per standard specifications</li>
                            <li>Transportation and delivery to the Buyer&apos;s designated facility</li>
                            <li>Real-time tracking and delivery status updates</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4. QUALITY STANDARDS</h3>
                        <p className="mb-4">
                            All stubble supplied shall meet the following minimum quality standards unless otherwise agreed:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Maximum moisture content as specified in Buyer&apos;s quality settings</li>
                            <li>Free from foreign materials and contamination</li>
                            <li>Properly baled and secured for transportation</li>
                            <li>Weight verification at source and destination</li>
                        </ul>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5. ORDERING AND DELIVERY</h3>
                        <p className="mb-4">
                            5.1 Buyer may place orders through the AgroCycle Platform specifying quantity and preferred delivery dates.
                        </p>
                        <p className="mb-4">
                            5.2 AgroCycle will confirm order acceptance within 24-48 hours based on availability.
                        </p>
                        <p className="mb-4">
                            5.3 Delivery schedules are subject to availability and weather conditions.
                        </p>
                        <p className="mb-4">
                            5.4 Buyer must inspect deliveries within 24 hours and report any quality issues.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6. PRICING AND PAYMENT</h3>
                        <p className="mb-4">
                            6.1 Prices are as agreed in the registration and may be revised with 30 days notice.
                        </p>
                        <p className="mb-4">
                            6.2 Payment terms are as specified in the Buyer profile settings.
                        </p>
                        <p className="mb-4">
                            6.3 All prices are exclusive of applicable taxes.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7. ACCEPTANCE AND REJECTION</h3>
                        <p className="mb-4">
                            7.1 Buyer may reject deliveries that do not meet the agreed quality standards.
                        </p>
                        <p className="mb-4">
                            7.2 Rejection must be documented with valid reasons within 24 hours of delivery.
                        </p>
                        <p className="mb-4">
                            7.3 Valid rejection reasons include: High moisture content, Contamination, and Under-weight.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8. TERM AND TERMINATION</h3>
                        <p className="mb-4">
                            8.1 This Agreement is effective from the date of acceptance until the agreement end date specified.
                        </p>
                        <p className="mb-4">
                            8.2 Either party may terminate with 30 days written notice.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">9. LIMITATION OF LIABILITY</h3>
                        <p className="mb-4">
                            AgroCycle&apos;s liability is limited to the value of the specific delivery in question.
                            We are not liable for consequential, indirect, or incidental damages.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10. GOVERNING LAW</h3>
                        <p className="mb-4">
                            This Agreement shall be governed by the laws of India. Any disputes shall be
                            subject to the exclusive jurisdiction of courts in Delhi.
                        </p>

                        <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">11. ACCEPTANCE</h3>
                        <p className="mb-4 font-medium">
                            By clicking &quot;Accept Agreement&quot; below, you confirm that you have read, understood,
                            and agree to be bound by all terms and conditions of this Agreement. You also confirm
                            that you are authorized to enter into this Agreement on behalf of the Buyer company.
                        </p>

                        <div className="text-center py-8 text-gray-400">
                            — End of Agreement —
                        </div>
                    </div>

                    {/* Accept Button Section */}
                    <div className="p-6 bg-gray-50 border-t border-gray-200">
                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleAcceptAgreement}
                            disabled={!hasScrolledToBottom || loading}
                            className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${hasScrolledToBottom
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <FiCheck className="w-5 h-5" />
                                    Accept Agreement
                                </>
                            )}
                        </button>

                        {!hasScrolledToBottom && (
                            <p className="text-center text-sm text-gray-500 mt-3">
                                Please scroll to the bottom of the agreement to enable the accept button
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
