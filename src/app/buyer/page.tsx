'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiLogIn, FiUserPlus, FiPackage } from 'react-icons/fi';

export default function BuyerLandingPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/30">
                        <FiPackage className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">AgroCycle</h1>
                    <p className="text-emerald-200 mt-2 text-lg">Buyer Portal</p>
                </div>

                {/* Actions Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-semibold text-gray-800 text-center mb-6">
                        Welcome to the Buyer Portal
                    </h2>
                    <p className="text-gray-500 text-center mb-8">
                        Manage your orders, track deliveries, and connect with farmers
                    </p>

                    <div className="space-y-4">
                        {/* Login Button */}
                        <button
                            onClick={() => router.push('/buyer/login')}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold 
                                       py-4 rounded-xl flex items-center justify-center gap-3 
                                       transition-all duration-200 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30"
                        >
                            <FiLogIn className="w-5 h-5" />
                            Login to Your Account
                        </button>

                        {/* Divider */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-gray-400 text-sm">or</span>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>

                        {/* Register Button */}
                        <button
                            onClick={() => router.push('/buyer/register')}
                            className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold 
                                       py-4 rounded-xl flex items-center justify-center gap-3 
                                       transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                        >
                            <FiUserPlus className="w-5 h-5" />
                            Create New Account
                        </button>
                    </div>

                    {/* Info */}
                    <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-700 text-center">
                            New buyers need to complete registration and accept the agreement before accessing the portal.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-emerald-200 text-sm mt-6">
                    AgroCycle Buyer Management System
                </p>
            </div>
        </div>
    );
}
