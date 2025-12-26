'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, OTPInput, LanguageToggle } from '@/components/ui';
import { FiPhone, FiArrowLeft } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        welcome: 'AgroCycle में आपका स्वागत है',
        tagline: 'अपनी पराली को कमाई में बदलें',
        enterPhone: 'अपना फ़ोन नंबर डालें',
        phonePlaceholder: '10 अंकों का मोबाइल नंबर',
        sendOtp: 'OTP भेजें',
        enterOtp: 'OTP दर्ज करें',
        otpSent: 'OTP भेजा गया',
        verifyOtp: 'OTP सत्यापित करें',
        resendOtp: 'OTP दोबारा भेजें',
        resendIn: 'दोबारा भेजें',
        seconds: 'सेकंड में',
        invalidPhone: 'कृपया सही 10 अंकों वाला फ़ोन नंबर डालें',
        invalidOtp: 'गलत OTP। कृपया पुन: प्रयास करें',
    },
    en: {
        welcome: 'Welcome to AgroCycle',
        tagline: 'Turn your stubble into income',
        enterPhone: 'Enter your phone number',
        phonePlaceholder: '10-digit mobile number',
        sendOtp: 'Send OTP',
        enterOtp: 'Enter OTP',
        otpSent: 'OTP sent to',
        verifyOtp: 'Verify OTP',
        resendOtp: 'Resend OTP',
        resendIn: 'Resend in',
        seconds: 'seconds',
        invalidPhone: 'Please enter a valid 10-digit phone number',
        invalidOtp: 'Invalid OTP. Please try again',
    },
};

export default function LoginPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    const startCountdown = () => {
        setCountdown(30);
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOTP = async () => {
        setError('');

        // Validate phone
        const cleanPhone = phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
            setError(text.invalidPhone);
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: cleanPhone }),
            });

            const data = await res.json();

            if (data.success) {
                setStep('otp');
                startCountdown();
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (otpValue?: string) => {
        const otpToVerify = otpValue || otp;
        if (otpToVerify.length !== 6) return;

        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.replace(/\D/g, ''), otp: otpToVerify }),
            });

            const data = await res.json();

            if (data.success) {
                // Store token
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('farmer', JSON.stringify(data.data.farmer));

                // Redirect based on user status
                if (data.data.isNewUser) {
                    router.push(`/${locale}/register`);
                } else {
                    router.push(`/${locale}/dashboard`);
                }
            } else {
                setError(text.invalidOtp);
                setOtp('');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLanguageChange = (newLocale: 'hi' | 'en') => {
        router.push(`/${newLocale}/login`);
    };

    return (
        <div className="min-h-screen-safe flex flex-col bg-gradient-to-b from-green-600 to-green-700">
            {/* Header */}
            <div className="flex justify-between items-center p-4 safe-area-top">
                {step === 'otp' ? (
                    <button
                        onClick={() => {
                            setStep('phone');
                            setOtp('');
                            setError('');
                        }}
                        className="p-2 text-white"
                    >
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                ) : (
                    <div />
                )}
                <LanguageToggle locale={locale} onChange={handleLanguageChange} />
            </div>

            {/* Logo & Welcome */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                <div className="text-center mb-12">
                    {/* Logo */}
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="text-5xl">🌾</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">{text.welcome}</h1>
                    <p className="text-green-100 text-lg">{text.tagline}</p>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
                    {step === 'phone' ? (
                        <>
                            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                                {text.enterPhone}
                            </h2>

                            <Input
                                type="tel"
                                inputMode="numeric"
                                icon={<FiPhone />}
                                placeholder={text.phonePlaceholder}
                                value={phone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setPhone(value);
                                    setError('');
                                }}
                                error={error}
                                maxLength={10}
                            />

                            <div className="mt-6">
                                <Button
                                    onClick={handleSendOTP}
                                    loading={loading}
                                    disabled={phone.length !== 10}
                                    icon="📱"
                                >
                                    {text.sendOtp}
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                                {text.enterOtp}
                            </h2>
                            <p className="text-gray-500 text-center mb-6">
                                {text.otpSent} <span className="font-semibold">+91 {phone}</span>
                            </p>

                            <OTPInput
                                value={otp}
                                onChange={setOtp}
                                onComplete={handleVerifyOTP}
                                error={!!error}
                            />

                            {error && (
                                <p className="text-red-500 text-center mt-4 text-sm">{error}</p>
                            )}

                            <div className="mt-6">
                                <Button
                                    onClick={() => handleVerifyOTP()}
                                    loading={loading}
                                    disabled={otp.length !== 6}
                                    icon="✅"
                                >
                                    {text.verifyOtp}
                                </Button>
                            </div>

                            {/* Resend OTP */}
                            <div className="mt-4 text-center">
                                {countdown > 0 ? (
                                    <p className="text-gray-500">
                                        {text.resendIn} {countdown} {text.seconds}
                                    </p>
                                ) : (
                                    <button
                                        onClick={handleSendOTP}
                                        className="text-green-600 font-semibold"
                                        disabled={loading}
                                    >
                                        {text.resendOtp}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Demo OTP hint for development */}
                <p className="text-green-100/70 text-xs mt-8 text-center">
                    {locale === 'hi'
                        ? 'डेमो: OTP कंसोल में देखें (F12)'
                        : 'Demo: Check console for OTP (F12)'}
                </p>
            </div>
        </div>
    );
}
