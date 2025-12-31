'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FiHome, FiMapPin, FiCalendar, FiClipboard, FiUser, FiMap } from 'react-icons/fi';

interface NavItem {
    icon: React.ReactNode;
    labelEn: string;
    labelHi: string;
    href: string;
}

const navItems: NavItem[] = [
    { icon: <FiHome />, labelEn: 'Home', labelHi: 'होम', href: '/dashboard' },
    { icon: <FiMap />, labelEn: 'Plots', labelHi: 'नक्शा', href: '/farm-plots' },
    { icon: <FiCalendar />, labelEn: 'Book', labelHi: 'बुक करें', href: '/book' },
    { icon: <FiClipboard />, labelEn: 'Bookings', labelHi: 'बुकिंग', href: '/bookings' },
    { icon: <FiUser />, labelEn: 'Profile', labelHi: 'प्रोफाइल', href: '/profile' },
];

interface BottomNavProps {
    locale: 'hi' | 'en';
}

export default function BottomNav({ locale }: BottomNavProps) {
    const pathname = usePathname();
    const router = useRouter();

    const isActive = (href: string) => {
        return pathname.includes(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <button
                            key={item.href}
                            onClick={() => router.push(`/${locale}${item.href}`)}
                            className={`
                flex flex-col items-center justify-center
                flex-1 h-full
                transition-all duration-200
                ${active ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}
              `}
                        >
                            <span className={`text-2xl mb-1 ${active ? 'scale-110' : ''} transition-transform`}>
                                {item.icon}
                            </span>
                            <span className={`text-xs font-medium ${active ? 'font-semibold' : ''}`}>
                                {locale === 'hi' ? item.labelHi : item.labelEn}
                            </span>
                            {active && (
                                <span className="absolute bottom-0 w-12 h-1 bg-green-600 rounded-t-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
