'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPhone, FiArrowRight } from 'react-icons/fi';

export default function OperatorLoginPage() {
    const router = useRouter();
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('operatorToken');
        if (token) router.push('/operator/dashboard');
    }, [router]);

    const handleSendOTP = async () => {
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError('Enter a valid 10-digit phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/operator/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.data?.otp) setDevOtp(data.data.otp);
                setStep('otp');
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Enter the 6-digit OTP');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/operator/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('operatorToken', data.data.token);
                localStorage.setItem('operator', JSON.stringify(data.data.operator));
                router.push('/operator/dashboard');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/30">
                        <span className="text-3xl">🚜</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">AgroCycle Operator</h1>
                    <p className="text-orange-200 mt-1">Field Operator Portal</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {step === 'phone' ? (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Welcome back!</h2>
                                <p className="text-sm text-gray-500 mt-1">Enter your phone number to sign in</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 text-sm">+91</span>
                                    <input
                                        type="tel" value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="9876543210"
                                        className="w-full pl-20 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none text-lg tracking-wider"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                            <button onClick={handleSendOTP} disabled={loading || phone.length !== 10}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold
                                    py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed">
                                {loading ? <span className="animate-spin">⏳</span> : <><FiArrowRight /> Send OTP</>}
                            </button>

                            <p className="text-center text-sm text-gray-500">
                                New operator?{' '}
                                <button onClick={() => router.push('/operator/register')} className="text-orange-600 font-medium hover:underline">
                                    Register here
                                </button>
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Verify OTP</h2>
                                <p className="text-sm text-gray-500 mt-1">Enter the code sent to +91 {phone}</p>
                            </div>

                            <input type="text" value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000" maxLength={6}
                                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none text-center text-2xl tracking-[0.5em] font-mono"
                                autoFocus
                            />

                            {error && <p className="text-red-600 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

                            <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold
                                    py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed">
                                {loading ? <span className="animate-spin">⏳</span> : 'Login'}
                            </button>

                            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                className="w-full text-gray-500 text-sm hover:text-gray-700 transition-colors">
                                ← Change phone number
                            </button>

                            {/* Show OTP button */}
                            {devOtp && (
                                <div className="mt-3 text-center">
                                    <button
                                        onClick={() => { setShowOtp(!showOtp); if (!showOtp) setTimeout(() => setShowOtp(false), 5000); }}
                                        className="text-xs text-gray-400 hover:text-orange-600 transition-colors underline">
                                        {showOtp ? '🔓 Hide OTP' : '🔑 Show OTP'}
                                    </button>
                                    {showOtp && (
                                        <p className="mt-1 text-lg font-mono font-bold text-orange-600 bg-orange-50 rounded-lg py-1.5 tracking-[0.4em]">
                                            {devOtp}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <p className="text-center text-orange-200/50 text-xs mt-6">AgroCycle Operator Portal</p>
            </div>
        </div>
    );
}
