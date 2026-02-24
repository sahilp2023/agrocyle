'use client';

import React, { useCallback } from 'react';

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayResponse) => void;
    prefill?: {
        name?: string;
        email?: string;
        contact?: string;
    };
    notes?: Record<string, string>;
    theme?: {
        color?: string;
    };
    modal?: {
        ondismiss?: () => void;
    };
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => {
            open: () => void;
            on: (event: string, callback: () => void) => void;
        };
    }
}

interface PaymentButtonProps {
    orderId: string;
    amount: number;
    orderNumber: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    onSuccess: (paymentData: RazorpayResponse) => void;
    onError?: (error: string) => void;
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
}

export default function RazorpayPaymentButton({
    orderId,
    amount,
    orderNumber,
    buyerName,
    buyerEmail,
    buyerPhone,
    onSuccess,
    onError,
    className = '',
    children,
    disabled = false,
}: PaymentButtonProps) {
    const [loading, setLoading] = React.useState(false);

    const loadRazorpayScript = useCallback(() => {
        return new Promise<boolean>((resolve) => {
            if (typeof window !== 'undefined' && window.Razorpay) {
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }, []);

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Failed to load Razorpay SDK');
            }

            // Create order on backend
            const token = localStorage.getItem('buyerToken');
            const response = await fetch(`/api/buyer/orders/${orderId}/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Failed to create payment order');
            }

            // Open Razorpay checkout
            const options: RazorpayOptions = {
                key: data.data.razorpayKeyId,
                amount: data.data.amount * 100, // Convert to paise
                currency: data.data.currency,
                name: 'AgroCycle',
                description: `Payment for Order #${orderNumber}`,
                order_id: data.data.razorpayOrderId,
                handler: async (response: RazorpayResponse) => {
                    // Verify payment on backend
                    try {
                        const verifyResponse = await fetch(`/api/buyer/orders/${orderId}/verify-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify(response),
                        });

                        const verifyData = await verifyResponse.json();
                        if (verifyData.success) {
                            onSuccess(response);
                        } else {
                            throw new Error(verifyData.message || 'Payment verification failed');
                        }
                    } catch (error) {
                        onError?.(error instanceof Error ? error.message : 'Payment verification failed');
                    }
                },
                prefill: {
                    name: buyerName,
                    email: buyerEmail,
                    contact: buyerPhone,
                },
                notes: {
                    orderId: orderId,
                    orderNumber: orderNumber,
                },
                theme: {
                    color: '#16a34a', // Green theme matching AgroCycle
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error('Payment error:', error);
            onError?.(error instanceof Error ? error.message : 'Payment failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePayment}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                </>
            ) : (
                children || `Pay ₹${amount.toLocaleString('en-IN')}`
            )}
        </button>
    );
}
