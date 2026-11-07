'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ThemeToggle';
import dynamic from 'next/dynamic';

const ProximityAlerts = dynamic(() => import('../../components/ProximityAlerts'), { ssr: false });
const NotificationBell = dynamic(() => import('../../components/NotificationManager'), { ssr: false });

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { isAuthenticated, loadUser, logout } = useAuthStore();
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        loadUser();
        setIsInitialized(true);
    }, [loadUser]);

    useEffect(() => {
        // Only redirect after we've checked localStorage
        if (isInitialized && !isAuthenticated) {
            router.push('/login');
        }
    }, [isInitialized, isAuthenticated, router]);

    if (!isInitialized || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gov-50 dark:bg-gov-950">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gov-50 dark:bg-gov-950 font-sans transition-colors duration-200">
            {/* Header */}
            <header className="glass sticky top-0 z-40 border-b border-gov-200 dark:border-gov-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/dashboard" className="flex items-center space-x-3 group">
                            <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-10 h-10 rounded-lg object-cover shadow-gov" />
                            <div className="leading-tight">
                                <div className="text-lg font-bold text-primary-800 dark:text-primary-300 tracking-tight">MargRakshak</div>
                                <div className="text-[10px] text-gov-500 dark:text-gov-400 tracking-wider uppercase">सड़क सुरक्षा • Citizen Portal</div>
                            </div>
                        </Link>

                        {/* Right side */}
                        <div className="flex items-center space-x-3">
                            <Link href="/dashboard/settings" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Settings">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </Link>
                            <div className="relative">
                                <NotificationBell />
                            </div>
                            <ThemeToggle />
                            <button
                                onClick={() => {
                                    logout();
                                    router.push('/');
                                }}
                                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 transition font-medium text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Proximity Alerts (rendered globally in dashboard) */}
            <ProximityAlerts />
        </div>
    );
}

