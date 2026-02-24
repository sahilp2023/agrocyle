'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiHome, FiClipboard, FiDollarSign, FiUser, FiBell, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

interface OperatorData {
    id: string;
    name: string;
    phone: string;
    operatorType: string;
    vehicleNumber: string;
    isOnline: boolean;
    profilePhoto?: string;
}

const navItems = [
    { href: '/operator/dashboard', label: 'Home', icon: FiHome },
    { href: '/operator/jobs', label: 'Jobs', icon: FiClipboard },
    { href: '/operator/earnings', label: 'Earnings', icon: FiDollarSign },
    { href: '/operator/profile', label: 'Profile', icon: FiUser },
];

export default function OperatorDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [operator, setOperator] = useState<OperatorData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('operatorToken');
        const operatorData = localStorage.getItem('operator');

        if (!token || !operatorData) {
            router.push('/operator/login');
            return;
        }

        try {
            const data = JSON.parse(operatorData);
            setOperator(data);
            setIsOnline(data.isOnline || false);
        } catch {
            router.push('/operator/login');
            return;
        }

        setLoading(false);
    }, [router]);

    const toggleOnline = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);

        try {
            const token = localStorage.getItem('operatorToken');
            await fetch('/api/operator/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isOnline: newStatus }),
            });

            // Update local storage
            if (operator) {
                const updated = { ...operator, isOnline: newStatus };
                setOperator(updated);
                localStorage.setItem('operator', JSON.stringify(updated));
            }
        } catch (error) {
            console.error('Failed to toggle status:', error);
            setIsOnline(!newStatus); // revert
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin text-4xl">🚜</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-lg">🚜</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 text-sm leading-tight">AgroCycle</h1>
                        <p className="text-xs text-gray-400">{operator?.vehicleNumber}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Online/Offline Toggle */}
                    <button onClick={toggleOnline}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                            ${isOnline
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                        {isOnline ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </button>

                    {/* Notification Bell */}
                    <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                        <FiBell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-auto pb-20">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-bottom">
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                        return (
                            <Link key={item.href} href={item.href}
                                className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all min-w-[64px]
                                    ${isActive
                                        ? 'text-orange-600'
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}>
                                <div className={`p-1.5 rounded-lg transition-all
                                    ${isActive ? 'bg-orange-100' : ''}`}>
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-medium ${isActive ? 'text-orange-600' : 'text-gray-400'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
