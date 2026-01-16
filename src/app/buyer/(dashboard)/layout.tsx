'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    FiHome, FiShoppingCart, FiTruck, FiSettings,
    FiLogOut, FiMenu, FiX, FiPlusCircle, FiMessageCircle
} from 'react-icons/fi';

interface Buyer {
    id: string;
    companyName: string;
    companyCode: string;
    contactPerson: string;
    email: string;
    plantCity: string;
    plantState: string;
}

const navItems = [
    { href: '/buyer/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/buyer/orders/create', label: 'Create Order', icon: FiPlusCircle },
    { href: '/buyer/orders', label: 'My Orders', icon: FiShoppingCart },
    { href: '/buyer/deliveries', label: 'Deliveries', icon: FiTruck },
    { href: '/buyer/quality', label: 'Quality Settings', icon: FiSettings },
    { href: '/buyer/support', label: 'Support', icon: FiMessageCircle },
];

export default function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [buyer, setBuyer] = useState<Buyer | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('buyerToken');
        const buyerData = localStorage.getItem('buyer');

        if (!token || !buyerData) {
            router.push('/buyer/login');
            return;
        }

        try {
            setBuyer(JSON.parse(buyerData));
        } catch {
            router.push('/buyer/login');
            return;
        }

        setLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('buyerToken');
        localStorage.removeItem('buyer');
        router.push('/buyer/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin text-4xl">🏭</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-white border-r border-gray-200 flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                            <span className="text-lg">🏭</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-800 text-sm">AgroCycle Buyer</h1>
                            <p className="text-xs text-gray-500">{buyer?.companyCode || 'Buyer Portal'}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-500"
                    >
                        <FiX />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                    <div className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== '/buyer/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-3 rounded-xl
                                        text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* User Info */}
                <div className="p-3 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-sm">
                                {buyer?.companyName?.charAt(0) || 'B'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                                {buyer?.contactPerson || 'Buyer'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {buyer?.plantCity}, {buyer?.plantState}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Logout"
                        >
                            <FiLogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Bar */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
                    >
                        <FiMenu className="w-6 h-6" />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="hidden sm:inline">{buyer?.companyName}</span>
                        <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                        <span className="text-emerald-600 font-medium">Online</span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
