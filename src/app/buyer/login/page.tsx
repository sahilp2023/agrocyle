'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMail, FiLock, FiLogIn, FiArrowLeft } from 'react-icons/fi';

export default function BuyerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Check if already logged in
        const token = localStorage.getItem('buyerToken');
        if (token) {
            router.push('/buyer/dashboard');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/buyer/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem('buyerToken', data.data.token);
                localStorage.setItem('buyer', JSON.stringify(data.data.buyer));
                router.push('/buyer/dashboard');
            } else {
                setError(data.error || 'Login failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back Button */}
                <button
                    onClick={() => router.push('/buyer')}
                    className="flex items-center gap-2 text-emerald-200 hover:text-white mb-6 transition-colors"
                >
                    <FiArrowLeft />
                    <span>Back</span>
                </button>

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4">
                        <span className="text-3xl">🏭</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">AgroCycle Buyer</h1>
                    <p className="text-emerald-200 mt-1">Sign in to your account</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Login</h2>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="buyer@company.com"
                                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                                               focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl 
                                               focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold 
                                       py-3 rounded-xl flex items-center justify-center gap-2 
                                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <FiLogIn />
                                    Sign In
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            Don&apos;t have an account?{' '}
                            <button
                                onClick={() => router.push('/buyer/register')}
                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-emerald-200 text-sm mt-6">
                    AgroCycle Buyer Portal
                </p>
            </div>
        </div>
    );
}
