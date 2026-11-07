'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ThemeToggle';

const NAV_LINKS = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#stats', label: 'Impact' },
    { href: '/heatmap', label: '🗺️ Hazard Map' },
];

const STATS = [
    { number: '10,000+', label: 'Hazards Reported', icon: '📍', color: 'text-accent-500' },
    { number: '8,500+',  label: 'Issues Resolved',  icon: '✅', color: 'text-success-600' },
    { number: '50+',     label: 'Cities Covered',   icon: '🏙️', color: 'text-primary-500' },
];

const FEATURES = [
    { icon: '📸', title: 'Photo Evidence',       desc: 'Upload up to 5 photos per report with automatic AI hazard detection.' },
    { icon: '📍', title: 'GPS Precision',         desc: 'Automatic GPS capture for accurate location pinpointing.' },
    { icon: '🤖', title: 'AI Classification',     desc: 'AI-powered automatic hazard type and severity detection from images.' },
    { icon: '🔔', title: 'Real-time Updates',     desc: 'Get instant push notifications when your report status changes.' },
    { icon: '🗺️', title: 'Interactive Heatmap',  desc: 'View all reported hazards in your district on a live map.' },
    { icon: '📊', title: 'Status Tracking',       desc: 'Track every report from submission to resolution with full transparency.' },
];

const STEPS = [
    { step: '01', icon: '✍️', title: 'Register',          desc: 'Create a free account in under 60 seconds.' },
    { step: '02', icon: '📱', title: 'Report Hazard',      desc: 'Upload a photo, pin the location, describe the issue.' },
    { step: '03', icon: '👮', title: 'Authorities Review', desc: 'Government officials review, prioritize, and assign the report.' },
    { step: '04', icon: '🎉', title: 'Issue Resolved',     desc: 'Track progress and receive notification on resolution.' },
];

export default function HomePage() {
    const [mounted, setMounted] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <div className="min-h-screen bg-gov-50 dark:bg-gov-950 font-sans">

            {/* ── Government Notice Bar ── */}
            <div className="gov-notice-bar text-white text-xs py-1.5 px-4 flex items-center justify-center gap-2 text-center">
                <span className="hidden sm:inline">🇮🇳</span>
                <span>An initiative of the Ministry of Road Transport &amp; Highways, Government of India</span>
                <span className="hidden sm:inline">🇮🇳</span>
            </div>

            {/* ── Navigation ── */}
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-md shadow-gov border-b border-gov-200 dark:border-gov-700'
                    : 'bg-white dark:bg-[#0f172a] border-b border-gov-200 dark:border-gov-800'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative">
                                <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-10 h-10 rounded-lg object-cover shadow-gov" />
                            </div>
                            <div className="leading-tight">
                                <div className="text-lg font-bold text-primary-800 dark:text-primary-300 tracking-tight">MargRakshak</div>
                                <div className="text-[10px] text-gov-500 dark:text-gov-400 -mt-0.5 tracking-widest uppercase">सड़क सुरक्षा</div>
                            </div>
                        </Link>

                        {/* Desktop nav */}
                        <div className="hidden md:flex items-center gap-6">
                            {NAV_LINKS.map(l => (
                                <a key={l.href} href={l.href} className="text-sm font-medium text-gov-600 dark:text-gov-300 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
                                    {l.label}
                                </a>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Link href="/login" className="hidden sm:inline-flex btn btn-secondary text-sm py-2 px-4">
                                Sign In
                            </Link>
                            <Link href="/register" className="btn btn-primary text-sm py-2 px-4">
                                Report Now
                            </Link>
                            {/* Mobile menu toggle */}
                            <button className="md:hidden p-2 rounded-lg text-gov-600 hover:bg-gov-100 dark:text-gov-300 dark:hover:bg-gov-800" onClick={() => setMobileOpen(!mobileOpen)}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu */}
                    {mobileOpen && (
                        <div className="md:hidden py-3 border-t border-gov-200 dark:border-gov-700 space-y-1">
                            {NAV_LINKS.map(l => (
                                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-2 text-sm text-gov-700 dark:text-gov-300 hover:bg-gov-100 dark:hover:bg-gov-800 rounded-lg">
                                    {l.label}
                                </a>
                            ))}
                            <Link href="/login" onClick={() => setMobileOpen(false)}
                                className="block px-4 py-2 text-sm text-primary-700 dark:text-primary-300 font-medium hover:bg-gov-100 dark:hover:bg-gov-800 rounded-lg">
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </nav>

            {/* ── Hero Section ── */}
            <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0e2450 0%, #163d82 50%, #2563b8 100%)' }}>
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>
                {/* Accent stripe */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-500" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Left */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: -30 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-white/20 tracking-widest uppercase">
                                <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
                                Government of India Initiative
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                                Make Our Roads<br />
                                <span className="text-accent-400">Safer Together</span>
                            </h1>
                            <p className="text-lg text-primary-200 mb-8 max-w-lg leading-relaxed">
                                Report potholes, broken street lights, and road hazards instantly. Your report reaches government officials within minutes.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/register" className="btn btn-accent text-base px-8 py-4 shadow-gov-lg">
                                    🚨 Report a Hazard
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </Link>
                                <a href="#how-it-works" className="btn btn-secondary bg-white/10 text-white border-white/30 hover:bg-white/20 text-base px-8 py-4">
                                    Learn More
                                </a>
                            </div>
                        </motion.div>

                        {/* Right — Stats */}
                        <motion.div
                            initial={mounted ? { opacity: 0, x: 30 } : false}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="grid grid-cols-1 gap-4"
                        >
                            {STATS.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={mounted ? { opacity: 0, y: 20 } : false}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 flex items-center gap-5"
                                >
                                    <div className="text-4xl">{stat.icon}</div>
                                    <div>
                                        <div className={`text-3xl font-black text-white`}>{stat.number}</div>
                                        <div className="text-primary-200 text-sm font-medium">{stat.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section id="features" className="py-20 px-4 bg-white dark:bg-gov-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-block bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
                            Platform Features
                        </div>
                        <h2 className="text-4xl font-extrabold text-gov-900 dark:text-white mb-4">
                            Powerful Tools for Citizens
                        </h2>
                        <p className="text-gov-600 dark:text-gov-400 max-w-xl mx-auto text-lg">
                            Everything you need to report, track, and resolve road hazards efficiently.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="card group hover:border-primary-300 dark:hover:border-primary-700 hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/40 rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gov-900 dark:text-white mb-2">{f.title}</h3>
                                <p className="text-gov-600 dark:text-gov-400 text-sm leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section id="how-it-works" className="py-20 px-4 bg-gov-50 dark:bg-gov-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="inline-block bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400 text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4">
                            Simple Process
                        </div>
                        <h2 className="text-4xl font-extrabold text-gov-900 dark:text-white mb-4">How It Works</h2>
                        <p className="text-gov-600 dark:text-gov-400 max-w-xl mx-auto text-lg">Four simple steps to make a difference in your community.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 to-accent-200 dark:from-primary-800 dark:to-accent-900" style={{ left: '12.5%', right: '12.5%' }} />

                        {STEPS.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="relative"
                            >
                                <div className="card text-center hover:border-primary-300">
                                    {/* Step number */}
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-700 to-primary-900 rounded-full flex items-center justify-center text-white text-sm font-black mx-auto mb-3 shadow-gov">
                                        {s.step}
                                    </div>
                                    <div className="text-4xl mb-3">{s.icon}</div>
                                    <h3 className="text-base font-bold text-gov-900 dark:text-white mb-2">{s.title}</h3>
                                    <p className="text-gov-500 dark:text-gov-400 text-sm">{s.desc}</p>
                                </div>
                                {i < 3 && (
                                    <div className="hidden md:flex absolute -right-3 top-14 z-10 w-6 h-6 bg-white dark:bg-gov-800 border-2 border-primary-300 dark:border-primary-600 rounded-full items-center justify-center">
                                        <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className="py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0e2450 0%, #1a4d9e 60%, #2563b8 100%)' }}>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-500" />
                <div className="max-w-4xl mx-auto text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-5xl mb-6">🚀</div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                            Ready to Make a Difference?
                        </h2>
                        <p className="text-xl mb-10 text-primary-200 max-w-2xl mx-auto">
                            Join thousands of citizens working together to create safer roads across India.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register" className="btn btn-accent text-lg px-10 py-4 shadow-gov-xl">
                                Start Reporting Now
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </Link>
                            <Link href="/heatmap" className="btn bg-white/10 text-white border border-white/30 hover:bg-white/20 text-lg px-10 py-4">
                                🗺️ View Hazard Map
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="text-white py-14 px-4" style={{ backgroundColor: '#0f172a' }}>
                <div className="max-w-7xl mx-auto">
                    {/* Animated Tricolor bar moving in the right direction */}
                    <div className="relative h-1.5 mb-10 rounded-full overflow-hidden bg-gov-800 shadow-gov">
                        <motion.div
                            className="absolute inset-y-0 left-0 flex w-[200%]"
                            animate={{ x: ['-50%', '0%'] }}
                            transition={{
                                repeat: Infinity,
                                repeatType: 'loop',
                                duration: 3.5,
                                ease: 'linear',
                            }}
                        >
                            {/* Segment 1 */}
                            <div className="w-1/2 flex h-full">
                                <div className="flex-1 bg-accent-500 shadow-sm" />
                                <div className="flex-1 bg-white" />
                                <div className="flex-1 bg-green-600 shadow-sm" />
                            </div>
                            {/* Segment 2 (Seamless loop duplicate) */}
                            <div className="w-1/2 flex h-full">
                                <div className="flex-1 bg-accent-500 shadow-sm" />
                                <div className="flex-1 bg-white" />
                                <div className="flex-1 bg-green-600 shadow-sm" />
                            </div>
                        </motion.div>
                        {/* Shimmer sweep moving right */}
                        <motion.div
                            className="absolute inset-y-0 w-28 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
                            animate={{ x: ['-100%', '1000%'] }}
                            transition={{
                                repeat: Infinity,
                                duration: 2.5,
                                ease: 'easeInOut',
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-10 h-10 rounded-lg" />
                                <div>
                                    <div className="font-bold text-lg">MargRakshak</div>
                                    <div className="text-xs text-gov-400 tracking-widest uppercase">सड़क सुरक्षा</div>
                                </div>
                            </div>
                            <p className="text-gov-400 text-sm leading-relaxed max-w-xs">
                                A Government of India initiative enabling citizens to report road hazards and ensure safer roads across the nation.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 text-gov-300 uppercase tracking-widest text-xs">Quick Links</h4>
                            <ul className="space-y-2 text-gov-400 text-sm">
                                {[['#features','Features'], ['#how-it-works','How It Works'], ['/login','Sign In'], ['/register','Register'], ['/heatmap','Hazard Map'], ['http://localhost:3001/login','Admin Portal ↗']].map(([href, label]) => (
                                    <li key={href}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 text-gov-300 uppercase tracking-widest text-xs">Support</h4>
                            <ul className="space-y-2 text-gov-400 text-sm">
                                {[['#','Help Center'], ['#','Contact Us'], ['#','Privacy Policy'], ['#','Terms of Service']].map(([href, label]) => (
                                    <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gov-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gov-500 text-sm">
                            © 2026 MargRakshak. All rights reserved. A Government of India initiative.
                        </p>
                        <p className="text-gov-600 text-xs">
                            Ministry of Road Transport &amp; Highways | Govt. of India
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

