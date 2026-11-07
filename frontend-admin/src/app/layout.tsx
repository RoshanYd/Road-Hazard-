import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';
import ThemeProvider from '../components/ThemeProvider';

export const metadata: Metadata = {
    title: 'MargRakshak Admin Portal - Road Hazard Management',
    description: 'Civic Authority & Department Dashboard for managing road hazard reports, dispatching crews, and monitoring resolution SLAs.',
    icons: {
        icon: '/margrakshak-logo.webp',
        apple: '/margrakshak-logo.webp',
    },
};

export const viewport: Viewport = {
    themeColor: '#0e2450',
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="icon" href="/margrakshak-logo.webp" />
                <link rel="apple-touch-icon" href="/margrakshak-logo.webp" />
            </head>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <ThemeProvider>
                    {children}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#fff',
                                color: '#363636',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#16a34a',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#dc2626',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </ThemeProvider>
            </body>
        </html>
    );
}
