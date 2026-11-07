'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem('MargRakshak-pwa-dismissed');
        if (dismissed) {
            const dismissedAt = new Date(dismissed).getTime();
            const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
            if (daysSince < 7) return; // Don't show again for 7 days
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show after 30 seconds of browsing
            setTimeout(() => setShowPrompt(true), 30000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setIsInstalled(true);
        }
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('MargRakshak-pwa-dismissed', new Date().toISOString());
    };

    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // SW registration failed — ignore silently
            });
        }
    }, []);

    if (isInstalled || !showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50"
            >
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-12 h-12 rounded-xl" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                            📱 Install MargRakshak
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Add to home screen for quick access, offline support & instant alerts
                        </p>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleInstall}
                                className="btn btn-primary text-xs py-1.5 px-4"
                            >
                                Install
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1.5 px-3"
                            >
                                Not now
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

