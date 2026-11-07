'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ThemeToggle';

const USER_PORTAL_URL = process.env.NEXT_PUBLIC_USER_PORTAL_URL || 'http://localhost:3000';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, loadUser, logout } = useAuthStore();
    const [isInitialized, setIsInitialized] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    useEffect(() => {
        loadUser();
        setIsInitialized(true);
    }, [loadUser]);

    useEffect(() => {
        if (isInitialized && !isAuthenticated) {
            router.push('/login');
        }
    }, [isInitialized, isAuthenticated, router]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileSidebarOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(path);
    };

    const navigation = [
        { name: 'Dashboard Overview', href: '/dashboard', icon: '📊' },
        { name: 'Hazard Reports', href: '/dashboard/reports', icon: '📋' },
        { name: 'Audit Logs', href: '/dashboard/audit', icon: '📝' },
    ];

    if (!isInitialized || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gov-50 dark:bg-gov-950">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-xs font-medium text-gov-500">Authenticating session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gov-50 dark:bg-gov-950 flex flex-col font-sans">
            {/* Government Top Bar */}
            <div className="gov-notice-bar text-white text-[11px] sm:text-xs py-1.5 px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 truncate">
                    <span className="flex-shrink-0">🇮🇳</span>
                    <span className="font-semibold tracking-wide truncate">MargRakshak Central Command</span>
                    <span className="hidden lg:inline text-primary-200">| Ministry of Road Transport &amp; Highways, Govt. of India</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] flex-shrink-0">
                    <a
                        href={USER_PORTAL_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-100 hover:text-white transition flex items-center gap-1 font-medium"
                    >
                        <span>Citizen Portal</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </a>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Mobile Drawer Backdrop */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar (Responsive drawer on mobile/tablet, fixed column on desktop) */}
                <aside
                    className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gov-900 border-r border-gov-200 dark:border-gov-800 flex flex-col shadow-gov transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
                        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                >
                    {/* Brand */}
                    <div className="p-4 sm:p-5 border-b border-gov-200 dark:border-gov-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/margrakshak-logo.webp"
                                alt="MargRakshak Admin"
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg object-cover shadow-gov"
                            />
                            <div>
                                <h1 className="font-bold text-sm sm:text-base text-gov-900 dark:text-white leading-tight">
                                    MargRakshak
                                </h1>
                                <p className="text-[9px] sm:text-[10px] text-accent-600 dark:text-accent-400 font-semibold tracking-wider uppercase">
                                    Admin Command • सड़क सुरक्षा
                                </p>
                            </div>
                        </div>

                        {/* Close button on mobile */}
                        <button
                            onClick={() => setMobileSidebarOpen(false)}
                            className="md:hidden p-1.5 text-gov-500 hover:text-gov-800 dark:hover:text-white rounded-lg"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 sm:p-4 space-y-1.5 overflow-y-auto">
                        <div className="text-[10px] uppercase font-bold text-gov-400 tracking-wider px-3 mb-2">
                            Operations Menu
                        </div>
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setMobileSidebarOpen(false)}
                                className={`sidebar-link ${isActive(item.href) ? 'sidebar-link-active' : ''}`}
                            >
                                <span className="text-lg mr-3">{item.icon}</span>
                                <span className="truncate">{item.name}</span>
                            </Link>
                        ))}
                    </nav>

                    {/* User Profile */}
                    <div className="p-3 sm:p-4 border-t border-gov-200 dark:border-gov-800 bg-gov-50/50 dark:bg-gov-900/50">
                        <div className="mb-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs sm:text-sm font-bold text-gov-900 dark:text-white truncate max-w-[130px]">{user?.name}</p>
                                <span
                                    className={`inline-block badge text-[9px] sm:text-[10px] ${
                                        user?.role === 'super_admin'
                                            ? 'badge-danger'
                                            : user?.role === 'manager'
                                            ? 'badge-warning'
                                            : 'badge-info'
                                    }`}
                                >
                                    {user?.role?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-[11px] text-gov-500 dark:text-gov-400 truncate mt-0.5">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full btn btn-secondary text-xs py-2 font-medium"
                        >
                            <svg className="w-3.5 h-3.5 mr-1.5 text-danger-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Secure Logout
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-auto flex flex-col w-full min-w-0">
                    {/* Header */}
                    <header className="bg-white dark:bg-gov-900 border-b border-gov-200 dark:border-gov-800 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-0 z-20">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Hamburger Button on mobile/tablet */}
                                <button
                                    onClick={() => setMobileSidebarOpen(true)}
                                    className="md:hidden p-2 rounded-lg text-gov-600 dark:text-gov-300 hover:bg-gov-100 dark:hover:bg-gov-800 -ml-1"
                                    aria-label="Open sidebar"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <div className="truncate">
                                    <h2 className="text-lg sm:text-2xl font-black text-gov-900 dark:text-white tracking-tight truncate">
                                        {navigation.find((item) => isActive(item.href))?.name || 'Dashboard'}
                                    </h2>
                                    <p className="text-[11px] sm:text-xs text-gov-500 dark:text-gov-400 mt-0.5 truncate hidden sm:block">
                                        Municipal Road Hazard Triage, Crew Dispatch &amp; Resolution Tracking
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                                <ThemeToggle />
                                <div className="hidden sm:block text-right border-l border-gov-200 dark:border-gov-800 pl-3 sm:pl-4">
                                    <p className="text-xs font-semibold text-gov-900 dark:text-white truncate max-w-[120px]">{user?.name}</p>
                                    <p className="text-[10px] text-accent-600 dark:text-accent-400 font-medium capitalize">
                                        {user?.role?.replace('_', ' ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="p-4 sm:p-6 lg:p-8 flex-1 w-full max-w-full overflow-x-hidden">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
