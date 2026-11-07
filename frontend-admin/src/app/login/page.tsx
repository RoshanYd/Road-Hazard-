'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ThemeToggle';

const USER_PORTAL_URL = process.env.NEXT_PUBLIC_USER_PORTAL_URL || 'http://localhost:3000';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        email: 'admin.gov.in',
        password: '',
    });
    const [errors, setErrors] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        const newErrors: any = {};
        const trimmedEmail = formData.email.trim().toLowerCase();

        if (!trimmedEmail) {
            newErrors.email = 'Official email or ID is required';
        } else if (!/\S+@\S+\.\S+/.test(trimmedEmail) && trimmedEmail !== 'admin.gov.in') {
            newErrors.email = 'Please enter a valid official address (e.g. admin.gov.in or admin@gov.in)';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            await login(formData.email.trim(), formData.password);
            setIsNavigating(true);
            router.push('/dashboard');
        } catch (error) {
            setIsNavigating(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gov-50 dark:bg-gov-950 font-sans">
            {/* Left Side - Authentication Form */}
            <div className="flex-1 flex flex-col justify-between px-4 sm:px-6 md:px-10 lg:px-12 bg-white dark:bg-gov-900 border-r border-gov-200 dark:border-gov-800 relative z-10 py-6 sm:py-8 min-h-screen">
                {/* Top Bar Navigation */}
                <div className="flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-4">
                    <a
                        href={USER_PORTAL_URL}
                        className="inline-flex items-center space-x-1.5 text-gov-600 dark:text-gov-300 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-xs sm:text-sm font-medium group"
                        title="Go to MargRakshak Citizen Portal"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Citizen Portal</span>
                    </a>
                    <ThemeToggle />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-md w-full mx-auto my-auto py-4"
                >
                    {/* Header Branding */}
                    <div className="text-center">
                        <div className="inline-block relative">
                            <img
                                src="/margrakshak-logo.webp"
                                alt="MargRakshak Admin Portal"
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto mb-3 shadow-gov object-cover border border-gov-200 dark:border-gov-700"
                            />
                            <span className="absolute -bottom-1 -right-1 bg-accent-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                                Admin
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gov-900 dark:text-white tracking-tight mt-1">
                            Admin Portal
                        </h1>
                        <p className="text-[11px] sm:text-xs font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-widest mt-1">
                            सड़क सुरक्षा प्रशासन • Operations Command
                        </p>
                        <p className="mt-1.5 text-xs sm:text-sm text-gov-600 dark:text-gov-400">
                            Sign in with your authorized departmental credentials
                        </p>
                    </div>

                    {/* Quick credential banner */}
                    <div className="mt-4 p-2.5 bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 rounded-lg text-center">
                        <p className="text-xs text-primary-900 dark:text-primary-200 font-medium">
                            🔑 Default: <code className="bg-white dark:bg-gov-800 px-1.5 py-0.5 rounded text-accent-600 dark:text-accent-400 font-bold">admin.gov.in</code> / <code className="bg-white dark:bg-gov-800 px-1.5 py-0.5 rounded text-accent-600 dark:text-accent-400 font-bold">admin123</code>
                        </p>
                    </div>

                    {/* Login Form */}
                    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">
                                    Official Email / Admin ID
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="text"
                                    autoComplete="username"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input ${errors.email ? 'input-error' : ''}`}
                                    placeholder="admin.gov.in"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-danger-600 dark:text-danger-400 font-medium">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gov-700 dark:text-gov-300">
                                        Password
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gov-400 hover:text-gov-600 dark:hover:text-gov-200 transition"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-danger-600 dark:text-danger-400 font-medium">{errors.password}</p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || isNavigating}
                            className="w-full btn btn-primary py-3 sm:py-3.5 text-sm sm:text-base font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-gov"
                        >
                            {(isLoading || isNavigating) ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    <span>{isNavigating ? 'Redirecting to Dashboard...' : 'Authenticating...'}</span>
                                </>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <span>Sign In to Command Portal</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </span>
                            )}
                        </button>

                        {/* Official Security Notice */}
                        <div className="pt-3 border-t border-gov-100 dark:border-gov-800 text-center">
                            <p className="text-[11px] text-gov-500 dark:text-gov-400 leading-relaxed">
                                🔒 <strong>Authorized Personnel Only:</strong> Access restricted to municipal officers, road engineers, and super administrators. All session events are audit-logged.
                            </p>
                        </div>
                    </form>
                </motion.div>

                {/* Footer copyright */}
                <div className="text-center pt-2 pb-1 text-[11px] text-gov-400">
                    © 2026 MargRakshak • Ministry of Road Transport &amp; Highways
                </div>
            </div>

            {/* Right Side - Administrative Command Hero (Cleanly responsive: visible on large screens, hidden on small phones/tablets) */}
            <div className="hidden lg:flex relative w-0 flex-1 bg-gov-gradient items-center justify-center p-8 xl:p-12 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                            backgroundSize: '40px 40px',
                        }}
                    />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-500" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 text-center max-w-lg"
                >
                    {/* Official MargRakshak Emblem in Hero (Replacing text IN) */}
                    <div className="w-24 h-24 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/30 shadow-gov-xl p-3">
                        <img
                            src="/margrakshak-logo.webp"
                            alt="MargRakshak Emblem"
                            className="w-full h-full rounded-xl object-cover shadow"
                        />
                    </div>

                    <div className="inline-block bg-white/10 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-3 border border-white/20 uppercase tracking-widest">
                        Government Operations Portal
                    </div>

                    <h2 className="text-3xl xl:text-4xl font-black text-white mb-3 leading-tight">
                        Road Infrastructure Command &amp; Control
                    </h2>
                    <p className="text-sm xl:text-base text-primary-100 leading-relaxed mb-6">
                        Centralized platform for road authorities to triage citizen hazard submissions, dispatch municipal repair teams, and track resolution SLAs in real time.
                    </p>

                    {/* Operational Pillars */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 text-left space-y-3.5 shadow-gov-lg">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow">
                                1
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-xs sm:text-sm">Triage &amp; AI Verification</h4>
                                <p className="text-xs text-primary-100 mt-0.5 leading-relaxed">
                                    Inspect crowdsourced photo evidence with automated Gemini AI severity analysis.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow">
                                2
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-xs sm:text-sm">Dispatch &amp; Crew Assignment</h4>
                                <p className="text-xs text-primary-100 mt-0.5 leading-relaxed">
                                    Assign repair work orders to maintenance divisions with target resolution timelines.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow">
                                3
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-xs sm:text-sm">Verify, Audit &amp; Notify</h4>
                                <p className="text-xs text-primary-100 mt-0.5 leading-relaxed">
                                    Record closure evidence, update public heatmaps, and notify citizens via WebSockets.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 text-xs text-primary-200 opacity-80">
                        Ministry of Road Transport &amp; Highways • Government of India
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
