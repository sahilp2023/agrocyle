'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiArrowRight, FiCheck, FiBriefcase, FiMapPin, FiFileText } from 'react-icons/fi';

interface FormData {
    // Company Details
    companyName: string;
    companyCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    gstNumber: string;
    panNumber: string;
    // Plant Location
    plantAddress: string;
    plantCity: string;
    plantState: string;
    plantPincode: string;
    // Agreement Terms
    agreementStartDate: string;
    agreementEndDate: string;
    pricePerTonne: string;
    minimumOrderTonnes: string;
}

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function BuyerRegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<FormData>({
        companyName: '',
        companyCode: '',
        contactPerson: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        gstNumber: '',
        panNumber: '',
        plantAddress: '',
        plantCity: '',
        plantState: '',
        plantPincode: '',
        agreementStartDate: '',
        agreementEndDate: '',
        pricePerTonne: '',
        minimumOrderTonnes: '10',
    });

    const updateField = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const validateStep = (stepNum: number): boolean => {
        switch (stepNum) {
            case 1:
                if (!formData.companyName || !formData.companyCode || !formData.contactPerson) {
                    setError('Please fill in all company details');
                    return false;
                }
                if (!formData.email || !formData.phone) {
                    setError('Email and phone are required');
                    return false;
                }
                if (!formData.password || formData.password.length < 6) {
                    setError('Password must be at least 6 characters');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    return false;
                }
                return true;
            case 2:
                if (!formData.plantAddress || !formData.plantCity || !formData.plantState || !formData.plantPincode) {
                    setError('Please fill in all plant location details');
                    return false;
                }
                return true;
            case 3:
                if (!formData.agreementStartDate || !formData.agreementEndDate || !formData.pricePerTonne) {
                    setError('Please fill in all agreement terms');
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const nextStep = () => {
        if (validateStep(step)) {
            setStep(prev => Math.min(prev + 1, 3));
        }
    };

    const prevStep = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setError('');
    };

    const handleSubmit = async () => {
        if (!validateStep(3)) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/buyer/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Store email for agreement page
                localStorage.setItem('pendingBuyerEmail', formData.email);
                router.push('/buyer/agreement');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, label: 'Company Details', icon: FiBriefcase },
        { num: 2, label: 'Plant Location', icon: FiMapPin },
        { num: 3, label: 'Agreement Terms', icon: FiFileText },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/buyer')}
                    className="flex items-center gap-2 text-emerald-200 hover:text-white mb-6 transition-colors"
                >
                    <FiArrowLeft />
                    <span>Back</span>
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Create Buyer Account</h1>
                    <p className="text-emerald-200 mt-2">Complete the registration to get started</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    {steps.map((s, index) => (
                        <React.Fragment key={s.num}>
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${step === s.num
                                ? 'bg-emerald-500 text-white'
                                : step > s.num
                                    ? 'bg-emerald-600/50 text-emerald-200'
                                    : 'bg-slate-700 text-slate-400'
                                }`}>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${step > s.num ? 'bg-emerald-400' : ''
                                    }`}>
                                    {step > s.num ? <FiCheck className="w-4 h-4" /> : s.num}
                                </div>
                                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-8 h-0.5 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Form Card */}
                <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
                    {/* Step 1: Company Details */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Company Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => updateField('companyName', e.target.value)}
                                        placeholder="Company Name"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Company Code *</label>
                                    <input
                                        type="text"
                                        value={formData.companyCode}
                                        onChange={(e) => updateField('companyCode', e.target.value.toUpperCase())}
                                        placeholder="COMPANY CODE (E.G. RELI)"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Person *</label>
                                    <input
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={(e) => updateField('contactPerson', e.target.value)}
                                        placeholder="Contact Person"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateField('email', e.target.value)}
                                        placeholder="Email"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => updateField('phone', e.target.value)}
                                        placeholder="Phone"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">GST Number</label>
                                    <input
                                        type="text"
                                        value={formData.gstNumber}
                                        onChange={(e) => updateField('gstNumber', e.target.value)}
                                        placeholder="GST Number"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">PAN Number</label>
                                <input
                                    type="text"
                                    value={formData.panNumber}
                                    onChange={(e) => updateField('panNumber', e.target.value.toUpperCase())}
                                    placeholder="PAN NUMBER"
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none uppercase"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => updateField('password', e.target.value)}
                                        placeholder="Password (min 6 chars)"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => updateField('confirmPassword', e.target.value)}
                                        placeholder="Confirm Password"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Plant Location */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold text-amber-400 mb-4">Plant Location</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Plant Address *</label>
                                <input
                                    type="text"
                                    value={formData.plantAddress}
                                    onChange={(e) => updateField('plantAddress', e.target.value)}
                                    placeholder="Plant Address"
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                                    <input
                                        type="text"
                                        value={formData.plantCity}
                                        onChange={(e) => updateField('plantCity', e.target.value)}
                                        placeholder="City"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                                    <select
                                        value={formData.plantState}
                                        onChange={(e) => updateField('plantState', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:border-emerald-500 focus:ring-0 outline-none"
                                    >
                                        <option value="">Select State</option>
                                        {INDIAN_STATES.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="md:w-1/2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Pincode *</label>
                                <input
                                    type="text"
                                    value={formData.plantPincode}
                                    onChange={(e) => updateField('plantPincode', e.target.value)}
                                    placeholder="Pincode"
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Agreement Terms */}
                    {step === 3 && (
                        <div className="space-y-5">
                            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Agreement Terms</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                                    <input
                                        type="date"
                                        value={formData.agreementStartDate}
                                        onChange={(e) => updateField('agreementStartDate', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                                    <input
                                        type="date"
                                        value={formData.agreementEndDate}
                                        onChange={(e) => updateField('agreementEndDate', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Price per Tonne (₹) *</label>
                                    <input
                                        type="number"
                                        value={formData.pricePerTonne}
                                        onChange={(e) => updateField('pricePerTonne', e.target.value)}
                                        placeholder="Price per Tonne (₹)"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Minimum Order (Tonnes)</label>
                                    <input
                                        type="number"
                                        value={formData.minimumOrderTonnes}
                                        onChange={(e) => updateField('minimumOrderTonnes', e.target.value)}
                                        placeholder="Minimum order quantity"
                                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:border-emerald-500 focus:ring-0 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-emerald-900/30 border border-emerald-700 rounded-xl mt-6">
                                <p className="text-emerald-200 text-sm">
                                    After completing registration, you will be redirected to view and accept the agreement before you can access the portal.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between mt-8">
                        {step > 1 ? (
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-xl transition-colors"
                            >
                                <FiArrowLeft />
                                Previous
                            </button>
                        ) : (
                            <div />
                        )}

                        {step < 3 ? (
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
                            >
                                Next
                                <FiArrowRight />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50"
                            >
                                {loading ? (
                                    <span className="animate-spin">⏳</span>
                                ) : (
                                    <>
                                        <FiFileText />
                                        View Agreement
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
