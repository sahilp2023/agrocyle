'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OperatorPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('operatorToken');
        if (token) {
            router.push('/operator/dashboard');
        } else {
            router.push('/operator/login');
        }
    }, [router]);

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="animate-spin text-4xl">🚜</div>
        </div>
    );
}
