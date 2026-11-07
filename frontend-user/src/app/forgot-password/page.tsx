'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function ForgotPasswordPage() {
    const router = useRouter();
    
    // State
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<any>({});
    
    // Testing only: remove in production
    const [mockOtp, setMockOtp] = useState('');

    // --- Helpers ---
    const getPasswordStrength = (pwd: string) => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[a-z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[@$!%*?&]/.test(pwd)) score++;
        return score;
    };
    const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const strengthColors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'];
    const strength = getPasswordStrength(password);

    // --- Actions ---
    
    // 1. Send OTP
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        setFieldErrors({});

        if (!email.trim()) { setFieldErrors({ email: 'Email address is required' }); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setFieldErrors({ email: 'Enter a valid email address' }); return; }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();

            if (data.success) {
                setMockOtp(data.resetToken || ''); // For testing without email server
                setStep('otp');
            } else {
                setServerError(data.message || 'Something went wrong. Please try again.');
            }
        } catch {
            setServerError('Unable to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        setFieldErrors({});

        if (!otp.trim() || otp.length !== 6) { setFieldErrors({ otp: 'Please enter a valid 6-digit OTP' }); return; }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/verify-reset-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), token: otp }),
            });
            const data = await res.json();

            if (data.success) {
                setStep('password');
            } else {
                setServerError(data.message || 'Invalid or expired OTP.');
            }
        } catch {
            setServerError('Unable to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Reset Password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        
        const errs: any = {};
        if (!password) errs.password = 'New password is required';
        else if (password.length < 8) errs.password = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password))
            errs.password = 'Must include uppercase, lowercase, number & special character (@$!%*?&)';
        if (!confirmPassword) errs.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase(), token: otp, password }),
            });
            const data = await res.json();

            if (data.success) {
                setStep('success');
                setTimeout(() => router.push('/login'), 3000);
            } else {
                setServerError(data.message || 'Failed to reset password. Please try again.');
            }
        } catch {
            setServerError('Unable to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gov-50 dark:bg-[#020617] px-4 py-12 font-sans">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(14,36,80,0.06) 1px, transparent 0)',
                    backgroundSize: '32px 32px',
                }} />
            </div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
                <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-gov-xl border border-gov-200 dark:border-gov-800 overflow-hidden">
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(to right, #0e2450, #1a4d9e, #f97316)' }} />

                    <div className="px-8 pt-8 pb-10">
                        <div className="text-center mb-6">
                            <Link href="/">
                                <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-16 h-16 rounded-xl mx-auto mb-4 shadow-gov" />
                            </Link>
                        </div>

                        {serverError && (
                            <div className="mb-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                                <span>⚠️</span> {serverError}
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* STEP 1: EMAIL */}
                            {step === 'email' && (
                                <motion.div key="step-email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                    <div className="text-center mb-6">
                                        <h1 className="text-2xl font-extrabold text-gov-900 dark:text-white">Forgot Password?</h1>
                                        <p className="mt-2 text-sm text-gov-600 dark:text-gov-400">
                                            Enter your registered email and we'll send you a 6-digit OTP to reset your password.
                                        </p>
                                    </div>
                                    <form onSubmit={handleSendEmail} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1.5">Email Address</label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setFieldErrors({}); }}
                                                placeholder="your@email.com"
                                                className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                                            />
                                            {fieldErrors.email && <p className="mt-1 text-sm text-danger-600">{fieldErrors.email}</p>}
                                        </div>
                                        <button type="submit" disabled={isLoading} className="w-full btn btn-primary py-3.5 flex justify-center items-center gap-2">
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>✉️ Send OTP</span>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 2: OTP */}
                            {step === 'otp' && (
                                <motion.div key="step-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <span className="text-3xl">📱</span>
                                        </div>
                                        <h1 className="text-2xl font-extrabold text-gov-900 dark:text-white">Enter OTP</h1>
                                        <p className="mt-2 text-sm text-gov-600 dark:text-gov-400">
                                            We sent a 6-digit code to <strong>{email}</strong>
                                        </p>
                                        
                                        {/* REMOVE IN PRODUCTION - FOR TESTING ONLY */}
                                        {mockOtp && (
                                            <div className="mt-3 p-2 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 text-xs rounded border border-yellow-300 dark:border-yellow-700 font-mono">
                                                Test Mode OTP: {mockOtp}
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={handleVerifyOtp} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1.5 text-center">6-Digit Code</label>
                                            <input
                                                type="text"
                                                value={otp}
                                                onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setFieldErrors({}); }}
                                                placeholder="••••••"
                                                className={`input text-center text-2xl tracking-widest font-mono ${fieldErrors.otp ? 'input-error' : ''}`}
                                            />
                                            {fieldErrors.otp && <p className="mt-1 text-sm text-center text-danger-600">{fieldErrors.otp}</p>}
                                        </div>
                                        <button type="submit" disabled={isLoading || otp.length !== 6} className="w-full btn btn-primary py-3.5 flex justify-center items-center gap-2">
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>Verify OTP</span>}
                                        </button>
                                        <div className="text-center">
                                            <button type="button" onClick={() => setStep('email')} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                                                Change Email Address
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 3: NEW PASSWORD */}
                            {step === 'password' && (
                                <motion.div key="step-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                    <div className="text-center mb-6">
                                        <h1 className="text-2xl font-extrabold text-gov-900 dark:text-white">Set New Password</h1>
                                        <p className="mt-2 text-sm text-gov-600 dark:text-gov-400">
                                            Please enter a strong password for your account.
                                        </p>
                                    </div>
                                    <form onSubmit={handleResetPassword} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1.5">New Password</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={e => { setPassword(e.target.value); setFieldErrors({}); }}
                                                className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                                            />
                                            {fieldErrors.password && <p className="mt-1 text-sm text-danger-600">{fieldErrors.password}</p>}
                                            {password.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthColors[strength] : 'bg-gov-200 dark:bg-gov-700'}`} />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gov-500">Strength: <strong>{strengthLabels[strength]}</strong></p>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1.5">Confirm Password</label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={e => { setConfirmPassword(e.target.value); setFieldErrors({}); }}
                                                className={`input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                                            />
                                            {fieldErrors.confirmPassword && <p className="mt-1 text-sm text-danger-600">{fieldErrors.confirmPassword}</p>}
                                        </div>
                                        <button type="submit" disabled={isLoading} className="w-full btn btn-primary py-3.5 flex justify-center items-center gap-2">
                                            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>🔐 Save New Password</span>}
                                        </button>
                                    </form>
                                </motion.div>
                            )}

                            {/* STEP 4: SUCCESS */}
                            {step === 'success' && (
                                <motion.div key="step-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">
                                        ✅
                                    </div>
                                    <h1 className="text-2xl font-extrabold text-gov-900 dark:text-white mb-2">Password Reset!</h1>
                                    <p className="text-gov-600 dark:text-gov-400 text-sm mb-6">
                                        Your password has been updated successfully.<br />
                                        Redirecting to Sign In in a moment...
                                    </p>
                                    <Link href="/login" className="btn btn-primary text-sm py-2.5 px-6">
                                        Sign In Now →
                                    </Link>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Footer Link */}
                        {step !== 'success' && (
                            <div className="mt-8 pt-6 border-t border-gov-100 dark:border-gov-800 text-center">
                                <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gov-600 hover:text-primary-700 font-medium">
                                    ← Back to Sign In
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
                <p className="text-center text-xs text-gov-400 mt-6">
                    🇮🇳 Ministry of Road Transport & Highways
                </p>
            </motion.div>
        </div>
    );
}

