'use client';

import dynamic from 'next/dynamic';
import { Toaster } from 'react-hot-toast';

// Dynamic imports to avoid SSR issues
const SaarthiChatbot = dynamic(() => import('./SaarthiChatbot'), { ssr: false });
const PWAInstallPrompt = dynamic(() => import('./PWAInstallPrompt'), { ssr: false });

export default function ClientProviders() {
    return (
        <>
            <SaarthiChatbot />
            <PWAInstallPrompt />
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--toast-bg, #fff)',
                        color: 'var(--toast-color, #363636)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    },
                    success: {
                        iconTheme: {
                            primary: '#22c55e',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </>
    );
}
