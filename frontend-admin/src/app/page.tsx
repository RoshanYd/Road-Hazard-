'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function HomePage() {
    const router = useRouter();
    const { isAuthenticated, loadUser } = useAuthStore();

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gov-50 dark:bg-gov-950 font-sans">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-600 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-xs font-semibold text-gov-500 tracking-wide uppercase">
                    MargRakshak Admin Portal
                </p>
            </div>
        </div>
    );
}
