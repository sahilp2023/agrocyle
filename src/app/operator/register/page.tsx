'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPhone, FiArrowRight, FiUser, FiTruck, FiHash, FiCreditCard, FiMapPin } from 'react-icons/fi';

type Step = 'phone' | 'otp' | 'details' | 'hub' | 'vehicle' | 'payment';

interface HubOption {
    _id: string;
    name: string;
    code: string;
    city: string;
    state: string;
}

export default function OperatorRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [devOtp, setDevOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    // Form data
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [name, setName] = useState('');
    const [operatorType, setOperatorType] = useState<'baler' | 'truck' | 'both'>('baler');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [vehicleModel, setVehicleModel] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');
    const [upiId, setUpiId] = useState('');
    const [selectedHubId, setSelectedHubId] = useState('');
    const [hubs, setHubs] = useState<HubOption[]>([]);
    const [hubsLoading, setHubsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('operatorToken');
        if (token) router.push('/operator/dashboard');
    }, [router]);

    // Load hubs when entering the hub step
    useEffect(() => {
        if (step === 'hub' && hubs.length === 0) {
            loadHubs();
        }
    }, [step]);

    const loadHubs = async () => {
        setHubsLoading(true);
        try {
            const res = await fetch('/api/operator/hubs');
            const data = await res.json();
            if (data.success) {
                setHubs(data.data || []);
            }
        } catch {
            console.error('Failed to load hubs');
        } finally {
            setHubsLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!/^[6-9]\d{9}$/.test(phone)) {
            setError('Enter a valid 10-digit Indian phone number');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/operator/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone, name: name || 'Operator', operatorType: 'baler',
                    vehicleNumber: vehicleNumber || 'TEMP',
                    hubId: selectedHubId || undefined,
                }),
            });
            const data = await res.json();

            if (data.success) {
                if (data.data?.otp) setDevOtp(data.data.otp);
                setStep('otp');
            } else if (data.error?.includes('already registered')) {
                setError('Phone already registered. Please login instead.');
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
                setStep('details');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDetails = () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        setError('');
        setStep('hub');
    };

    const handleSelectHub = () => {
        if (!selectedHubId) {
            setError('Please select a hub to work with');
            return;
        }
        setError('');
        setStep('vehicle');
    };

    const handleSaveVehicle = () => {
        if (!vehicleNumber.trim()) {
            setError('Vehicle number is required');
            return;
        }
        setError('');
        setStep('payment');
    };

    const handleComplete = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('operatorToken');
            const res = await fetch('/api/operator/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    operatorType,
                    vehicleNumber: vehicleNumber.toUpperCase(),
                    vehicleModel,
                    licenseNumber,
                    upiId,
                    hubId: selectedHubId || undefined,
                }),
            });

            const data = await res.json();
            if (data.success) {
                localStorage.setItem('operator', JSON.stringify(data.data));
                router.push('/operator/dashboard');
            } else {
                setError(data.error || 'Failed to update profile');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const steps: { key: Step; label: string }[] = [
        { key: 'phone', label: 'Phone' },
        { key: 'otp', label: 'Verify' },
        { key: 'details', label: 'Profile' },
        { key: 'hub', label: 'Hub' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'payment', label: 'Payment' },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg shadow-orange-500/30">
                        <span className="text-3xl">🚜</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">AgroCycle Operator</h1>
                    <p className="text-orange-200 mt-1">Join as a field operator</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-1 mb-6">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.key}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${i <= currentStepIndex ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/40'}`}>
                                {i + 1}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-6 h-0.5 ${i < currentStepIndex ? 'bg-orange-500' : 'bg-white/10'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-6">
                    {/* Step: Phone */}
                    {step === 'phone' && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Enter your phone</h2>
                                <p className="text-sm text-gray-500 mt-1">We&apos;ll send a verification code</p>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                                <input type="tel" value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    placeholder="9876543210"
                                    className="w-full pl-14 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none text-lg tracking-wider"
                                    autoFocus />
                            </div>
                            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                            <button onClick={handleSendOTP} disabled={loading || phone.length !== 10}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold
                                    py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                {loading ? <span className="animate-spin">⏳</span> : <><FiArrowRight /> Get OTP</>}
                            </button>
                            <p className="text-center text-sm text-gray-500">
                                Already have an account?{' '}
                                <button onClick={() => router.push('/operator/login')} className="text-orange-600 font-medium hover:underline">
                                    Login
                                </button>
                            </p>
                        </div>
                    )}

                    {/* Step: OTP */}
                    {step === 'otp' && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Verify OTP</h2>
                                <p className="text-sm text-gray-500 mt-1">Enter the 6-digit code sent to +91 {phone}</p>
                            </div>
                            <input type="text" value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000" maxLength={6}
                                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none text-center text-2xl tracking-[0.5em] font-mono"
                                autoFocus />
                            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                            <button onClick={handleVerifyOTP} disabled={loading || otp.length !== 6}
                                className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold
                                    py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                {loading ? <span className="animate-spin">⏳</span> : 'Verify & Continue'}
                            </button>
                            <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                                className="w-full text-gray-500 text-sm hover:text-gray-700">
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

                    {/* Step: Personal Details */}
                    {step === 'details' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Your Details</h2>
                                <p className="text-sm text-gray-500 mt-1">Tell us about yourself</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                        placeholder="Your full name"
                                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none" autoFocus />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">I operate</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['baler', 'truck', 'both'] as const).map(type => (
                                        <button key={type} type="button" onClick={() => setOperatorType(type)}
                                            className={`p-3 rounded-xl border-2 text-center transition-all ${operatorType === type
                                                ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600'}`}>
                                            <span className="text-xl">{type === 'baler' ? '🚜' : type === 'truck' ? '🚛' : '🚜🚛'}</span>
                                            <p className="text-xs font-medium mt-1 capitalize">{type}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                            <button onClick={handleSaveDetails}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                <FiArrowRight /> Next: Select Hub
                            </button>
                        </div>
                    )}

                    {/* Step: Hub Selection */}
                    {step === 'hub' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Select Working Area</h2>
                                <p className="text-sm text-gray-500 mt-1">Choose the hub nearest to your location</p>
                            </div>

                            {hubsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin text-2xl">🔄</div>
                                </div>
                            ) : hubs.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 text-sm">No hubs available</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                    {hubs.map(hub => (
                                        <button key={hub._id} type="button"
                                            onClick={() => setSelectedHubId(hub._id)}
                                            className={`w-full p-4 rounded-xl border-2 text-left transition-all
                                                ${selectedHubId === hub._id
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 hover:border-gray-300'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                                    ${selectedHubId === hub._id ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}>
                                                    <FiMapPin className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">{hub.name}</p>
                                                    <p className="text-sm text-gray-500">{hub.city}, {hub.state}</p>
                                                </div>
                                                {selectedHubId === hub._id && (
                                                    <span className="ml-auto text-orange-500 text-lg">✓</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3">
                                <button onClick={() => { setStep('details'); setError(''); }}
                                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                    Back
                                </button>
                                <button onClick={handleSelectHub}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <FiArrowRight /> Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Vehicle Details */}
                    {step === 'vehicle' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Vehicle Details</h2>
                                <p className="text-sm text-gray-500 mt-1">Your vehicle information</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Number <span className="text-red-500">*</span></label>
                                <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                                    placeholder="HR-12-AB-1234"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none uppercase" autoFocus />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Model (optional)</label>
                                <input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)}
                                    placeholder="e.g. John Deere 459 / Tata Ace"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">License Number (optional)</label>
                                <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
                                    placeholder="DL-1234567890"
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none" />
                            </div>
                            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3">
                                <button onClick={() => { setStep('hub'); setError(''); }}
                                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                    Back
                                </button>
                                <button onClick={handleSaveVehicle}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <FiArrowRight /> Next
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step: Payment Details */}
                    {step === 'payment' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-800">Payment Details</h2>
                                <p className="text-sm text-gray-500 mt-1">How you&apos;ll receive payments</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">UPI ID (optional)</label>
                                <div className="relative">
                                    <FiCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)}
                                        placeholder="yourname@upi"
                                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none" autoFocus />
                                </div>
                            </div>
                            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <p className="text-sm text-orange-700">
                                    💡 You can add bank account details later from your profile. UPI is the fastest way to receive payments.
                                </p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-sm text-blue-700">
                                    ℹ️ Your hub manager will review and approve your registration. You&apos;ll be notified once verified.
                                </p>
                            </div>
                            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
                            <div className="flex gap-3">
                                <button onClick={() => { setStep('vehicle'); setError(''); }}
                                    className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors">
                                    Back
                                </button>
                                <button onClick={handleComplete} disabled={loading}
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    {loading ? <span className="animate-spin">⏳</span> : '🚀 Complete Setup'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-center text-orange-200/50 text-xs mt-6">AgroCycle Operator Portal • v1.0</p>
            </div>
        </div>
    );
}
