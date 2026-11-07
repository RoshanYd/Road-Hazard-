import type { Metadata, Viewport } from 'next';
import ClientProviders from '../components/ClientProviders';
import ThemeProvider from '../components/ThemeProvider';
import '../styles/globals.css';

export const metadata: Metadata = {
    title: 'MargRakshak - Citizen Road Hazard Reporting Portal',
    description: 'Empowering citizens to report road hazards (potholes, street lights, broken roads) and track resolution in real-time across India.',
    keywords: 'road safety, pothole reporting, street light, road hazard, civic engagement, MargRakshak',
    manifest: '/manifest.json',
    icons: {
        icon: '/margrakshak-logo.webp',
        apple: '/margrakshak-logo.webp',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'MargRakshak',
    },
};

export const viewport: Viewport = {
    themeColor: '#0e2450',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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
                <meta name="apple-mobile-web-app-capable" content="yes" />
            </head>
            <body className="font-sans antialiased" suppressHydrationWarning>
                <ThemeProvider>
                    {children}
                    <ClientProviders />
                </ThemeProvider>
            </body>
        </html>
    );
}
