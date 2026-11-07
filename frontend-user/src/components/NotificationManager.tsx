'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../lib/websocket';
import toast from 'react-hot-toast';

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    report_id?: string;
}

export default function NotificationManager() {
    const { user } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const prevCountRef = useRef(0);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const [permissionGranted, setPermissionGranted] = useState(false);

    // WebSocket connection
    const { on, isAuthenticated, connectionState } = useWebSocket();

    // Request browser notification permission
    useEffect(() => {
        if (!user) return;
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                setPermissionGranted(true);
            } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(perm => {
                    setPermissionGranted(perm === 'granted');
                });
            }
        }
    }, [user]);

    // Show browser notification
    const showBrowserNotification = useCallback((title: string, body: string) => {
        if (!permissionGranted || typeof window === 'undefined') return;
        try {
            const notif = new window.Notification(title, {
                body,
                icon: '/margrakshak-logo.webp',
                badge: '/margrakshak-logo.webp',
                tag: 'road-safety-' + Date.now(),
                requireInteraction: false,
            });
            notif.onclick = () => {
                window.focus();
                setIsOpen(true);
                notif.close();
            };
            setTimeout(() => notif.close(), 8000);
        } catch (e) {
            // Ignore notification errors
        }
    }, [permissionGranted]);

    // Listen for WebSocket events (real-time push)
    useEffect(() => {
        if (!isAuthenticated) return;

        const unsubStatus = on('STATUS_UPDATE', (event) => {
            const statusText = (event.newStatus || '').replace(/_/g, ' ');
            toast.success(`📋 Report status → ${statusText}`, { duration: 5000 });
            showBrowserNotification('🔔 Status Update', event.message || `Report status changed to ${statusText}`);
            setUnreadCount(prev => prev + 1);
            // Refresh notifications if panel is open
            if (isOpen) fetchNotifications();
        });

        const unsubResponse = on('ADMIN_RESPONSE', (event) => {
            toast.success('💬 Admin responded to your report!', { duration: 5000 });
            showBrowserNotification('💬 Admin Response', event.message || 'An admin responded to your report');
            setUnreadCount(prev => prev + 1);
            if (isOpen) fetchNotifications();
        });

        return () => {
            unsubStatus();
            unsubResponse();
        };
    }, [isAuthenticated, on, showBrowserNotification, isOpen]);

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;
        try {
            const res = await notificationAPI.getUnreadCount();
            const newCount = Number(res.data.unreadCount) || 0;
            prevCountRef.current = newCount;
            setUnreadCount(newCount);
        } catch (e) {
            // Silently fail
        }
    }, [user]);

    // Polling fallback — only when WebSocket is NOT connected
    useEffect(() => {
        if (!user) return;

        // Initial fetch
        fetchUnreadCount();

        // If WebSocket is connected, use longer poll interval as backup
        // If disconnected, use shorter interval as primary mechanism
        const interval = isAuthenticated ? 120000 : 30000;
        pollRef.current = setInterval(fetchUnreadCount, interval);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [user, fetchUnreadCount, isAuthenticated]);

    // Fetch notifications when panel opens
    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const res = await notificationAPI.getNotifications({ limit: 20 });
            setNotifications(res.data.notifications || []);
        } catch (e) {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    };

    const togglePanel = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { /* ignore */ }
    };

    const markAllRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) { /* ignore */ }
    };

    const formatTime = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    if (!user) return null;

    return (
        <>
            {/* Notification Bell */}
            <button
                onClick={togglePanel}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Notifications"
            >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Connection status dot */}
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                    isAuthenticated ? 'bg-green-500' : connectionState === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
                }`} />
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Notification Panel Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 z-50 max-h-[500px] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200">🔔 Notifications</h3>
                                    <span className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-gray-400'}`} title={isAuthenticated ? 'Live' : 'Polling'} />
                                </div>
                                {(unreadCount > 0 || notifications.some(n => !n.is_read)) && (
                                    <button onClick={markAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            {/* Notification List */}
                            <div className="overflow-y-auto flex-1">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <p className="text-3xl mb-2">🔕</p>
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                                            className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                                                !notif.is_read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {!notif.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${!notif.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(notif.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

