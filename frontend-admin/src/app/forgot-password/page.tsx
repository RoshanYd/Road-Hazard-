'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '../../components/ThemeToggle';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Step = 'email' | 'otp' | 'password' | 'success';

export default function AdminForgotPasswordPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<any>({});
    const [mockOtp, setMockOtp] = useState('');

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

    // 1. Send OTP to admin email
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        setFieldErrors({});

        if (!email.trim()) {
            setFieldErrors({ email: 'Official email address is required' });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setFieldErrors({ email: 'Enter a valid email address' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();

            if (data.success) {
                setMockOtp(data.resetToken || '');
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

        if (!otp.trim() || otp.length !== 6) {
            setFieldErrors({ otp: 'Please enter a valid 6-digit OTP' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/verify-reset-token`, {
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
        setFieldErrors({});

        const errors: any = {};
        if (!password) errors.password = 'Password is required';
        else if (password.length < 8) errors.password = 'Must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
            errors.password = 'Must include upper, lower, number and special char (@$!%*?&)';
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    token: otp,
                    password,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setStep('success');
            } else {
                setServerError(data.message || 'Could not reset password. Please try again.');
            }
        } catch {
            setServerError('Unable to connect to server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-gov-50 dark:bg-gov-950 font-sans">
            {/* Left Side - Reset Steps */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 bg-white dark:bg-gov-900 border-r border-gov-200 dark:border-gov-800 relative z-10 py-12">
                <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                    <Link
                        href="/login"
                        className="inline-flex items-center space-x-2 text-gov-500 hover:text-primary-700 dark:hover:text-primary-300 transition-colors text-sm font-medium group"
                    >
                        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span>Back to Login</span>
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="max-w-md w-full mx-auto space-y-6 mt-6">
                    {/* Header */}
                    <div className="text-center">
                        <img
                            src="/margrakshak-logo.webp"
                            alt="MargRakshak Admin"
                            className="w-14 h-14 rounded-xl mx-auto mb-3 shadow-gov object-cover"
                        />
                        <h1 className="text-2xl font-bold text-gov-900 dark:text-white">
                            Admin Password Recovery
                        </h1>
                        <p className="mt-1 text-xs text-gov-500 dark:text-gov-400">
                            Secure 6-digit OTP verification for authorized administrative personnel
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center space-x-2">
                        {(['email', 'otp', 'password', 'success'] as Step[]).map((s, idx) => {
                            const steps: Step[] = ['email', 'otp', 'password', 'success'];
                            const currentIdx = steps.indexOf(step);
                            const thisIdx = idx;
                            return (
                                <div key={s} className="flex items-center">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                            thisIdx < currentIdx
                                                ? 'bg-success-600 text-white'
                                                : thisIdx === currentIdx
                                                ? 'bg-primary-700 text-white ring-2 ring-primary-300'
                                                : 'bg-gov-200 dark:bg-gov-800 text-gov-500'
                                        }`}
                                    >
                                        {thisIdx < currentIdx ? '✓' : idx + 1}
                                    </div>
                                    {idx < 3 && (
                                        <div
                                            className={`w-8 h-0.5 ${
                                                thisIdx < currentIdx
                                                    ? 'bg-success-600'
                                                    : 'bg-gov-200 dark:bg-gov-700'
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Server Error Alert */}
                    {serverError && (
                        <div className="p-3 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 rounded-lg text-danger-700 dark:text-danger-300 text-xs flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{serverError}</span>
                        </div>
                    )}

                    {/* Simulation note for testing */}
                    {mockOtp && step === 'otp' && (
                        <div className="p-3 bg-primary-50 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-800 dark:text-primary-200 text-xs">
                            <span className="font-bold">Admin Verification OTP:</span>{' '}
                            <code className="bg-white dark:bg-gov-900 px-2 py-0.5 rounded font-mono text-sm font-black text-accent-600">
                                {mockOtp}
                            </code>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Step 1: Email */}
                        {step === 'email' && (
                            <motion.form
                                key="email"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleSendEmail}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">
                                        Official Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="admin@morth.gov.in"
                                        className={`input ${fieldErrors.email ? 'input-error' : ''}`}
                                    />
                                    {fieldErrors.email && (
                                        <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{fieldErrors.email}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn btn-primary py-3 font-semibold text-sm disabled:opacity-70 flex items-center justify-center shadow-gov"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            <span>Sending Security OTP...</span>
                                        </>
                                    ) : (
                                        <span>Send Verification OTP</span>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {/* Step 2: OTP */}
                        {step === 'otp' && (
                            <motion.form
                                key="otp"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">
                                        Enter 6-Digit OTP
                                    </label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="123456"
                                        className={`input text-center text-2xl font-mono tracking-widest ${
                                            fieldErrors.otp ? 'input-error' : ''
                                        }`}
                                    />
                                    {fieldErrors.otp && (
                                        <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{fieldErrors.otp}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn btn-primary py-3 font-semibold text-sm disabled:opacity-70 flex items-center justify-center shadow-gov"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            <span>Verifying Code...</span>
                                        </>
                                    ) : (
                                        <span>Verify OTP</span>
                                    )}
                                </button>

                                <div className="text-center">
                                    <button
                                        type="button"
                                        onClick={() => setStep('email')}
                                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        Use a different email address
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* Step 3: Password */}
                        {step === 'password' && (
                            <motion.form
                                key="password"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`input ${fieldErrors.password ? 'input-error' : ''}`}
                                    />
                                    {fieldErrors.password && (
                                        <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{fieldErrors.password}</p>
                                    )}

                                    {/* Strength indicator */}
                                    {password && (
                                        <div className="mt-2 space-y-1">
                                            <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-gov-100 dark:bg-gov-800">
                                                {[1, 2, 3, 4, 5].map((lvl) => (
                                                    <div
                                                        key={lvl}
                                                        className={`flex-1 transition-all duration-300 ${
                                                            strength >= lvl ? strengthColors[strength] : 'bg-transparent'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-gov-500">
                                                Strength:{' '}
                                                <span className="font-semibold">{strengthLabels[strength]}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={`input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                                    />
                                    {fieldErrors.confirmPassword && (
                                        <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">{fieldErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn btn-primary py-3 font-semibold text-sm disabled:opacity-70 flex items-center justify-center shadow-gov"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            <span>Updating Password...</span>
                                        </>
                                    ) : (
                                        <span>Reset Password</span>
                                    )}
                                </button>
                            </motion.form>
                        )}

                        {/* Step 4: Success */}
                        {step === 'success' && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-4 py-4"
                            >
                                <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 text-success-600 dark:text-success-400 rounded-full flex items-center justify-center text-3xl mx-auto shadow-gov">
                                    ✓
                                </div>
                                <h3 className="text-xl font-bold text-gov-900 dark:text-white">
                                    Password Successfully Reset
                                </h3>
                                <p className="text-sm text-gov-600 dark:text-gov-400">
                                    Your official credentials have been updated. You can now sign in to the Admin Portal.
                                </p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full btn btn-primary py-3 font-semibold text-sm shadow-gov"
                                >
                                    Proceed to Admin Login →
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Side - Branding Hero */}
            <div className="hidden lg:flex relative w-0 flex-1 bg-gov-gradient items-center justify-center p-12 overflow-hidden">
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

                <div className="relative z-10 text-center max-w-md text-white">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-gov-xl">
                        <span className="text-3xl">🛡️</span>
                    </div>
                    <h3 className="text-2xl font-black mb-3">High Security Protocol</h3>
                    <p className="text-sm text-primary-100 leading-relaxed">
                        Admin credential recovery uses cryptographic one-time passwords expiring within 15 minutes. All reset attempts are recorded in the central administrative audit log.
                    </p>
                </div>
            </div>
        </div>
    );
}

