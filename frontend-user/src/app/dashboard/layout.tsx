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
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 gap-2">
                        {/* Logo & Brand */}
                        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 group min-w-0 flex-shrink">
                            <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover shadow-gov flex-shrink-0" />
                            <div className="leading-tight min-w-0">
                                <div className="text-base sm:text-lg font-bold text-primary-800 dark:text-primary-300 tracking-tight truncate">
                                    MargRakshak
                                </div>
                                <div className="text-[9px] sm:text-[10px] text-gov-500 dark:text-gov-400 tracking-wider uppercase truncate">
                                    <span className="sm:hidden">सड़क सुरक्षा</span>
                                    <span className="hidden sm:inline">सड़क सुरक्षा • Citizen Portal</span>
                                </div>
                            </div>
                        </Link>

                        {/* Right side controls */}
                        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                            <Link href="/dashboard/settings" className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300" title="Settings">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition font-medium text-xs sm:text-sm flex items-center gap-1"
                                title="Logout"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-12">
                {children}
            </main>

            {/* Proximity Alerts (rendered globally in dashboard) */}
            <ProximityAlerts />
        </div>
    );
}

