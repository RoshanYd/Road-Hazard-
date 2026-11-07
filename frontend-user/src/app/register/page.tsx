'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';

export default function RegisterPage() {
    const router = useRouter();
    const { register, login, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState<any>({});
    const [serverError, setServerError] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    const validate = () => {
        const newErrors: any = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone) newErrors.phone = 'Phone number is required';
        else if (!/^[0-9]{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be exactly 10 digits';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password))
            newErrors.password = 'Must include uppercase, lowercase, number & special character (@$!%*?&)';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');
        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        try {
            await register(formData.name, formData.email, formData.password, formData.phone);
            setSuccess(true);
            setIsNavigating(true);
            
            // Automatically log in the user after successful registration
            try {
                await login(formData.email, formData.password);
                router.push('/dashboard');
            } catch (err) {
                // If auto-login fails, redirect to login page
                router.push('/login');
            }
        } catch (error: any) {
            setIsNavigating(false);
            const msg = error.response?.data?.message || error.response?.data?.errors?.[0]?.message || '';
            if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate')) {
                setErrors({ email: 'An account with this email already exists' });
            } else if (msg) {
                setServerError(msg);
            }
        }
    };

    return (
        <div className="min-h-screen flex bg-gov-50 dark:bg-gov-950 font-sans">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#0f172a] lg:border-r border-gov-200 dark:border-gov-800 relative z-10 py-12">
                <div className="absolute top-8 left-8 hidden sm:block">
                    <Link href="/" className="inline-flex items-center space-x-2 group">
                        <svg className="w-5 h-5 text-gov-500 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm font-medium text-gov-500 group-hover:text-primary-600 transition-colors">Back to Home</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-xl w-full mx-auto space-y-8"
                >
                    <div className="text-center">
                        <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-16 h-16 rounded-xl mx-auto mb-6 shadow-gov" />
                        <h2 className="text-3xl font-extrabold text-gov-900 dark:text-white">
                            Citizen Registration
                        </h2>
                        <p className="mt-2 text-gov-600 dark:text-gov-400">
                            Create an account to start reporting road hazards
                        </p>
                    </div>


                    {/* Success Banner */}
                    {success && (
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <span>✅</span> Account created! Redirecting to login...
                        </div>
                    )}

                    {/* Server Error Banner */}
                    {serverError && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <span>⚠️</span> {serverError}
                        </div>
                    )}

                    <form className="mt-2 space-y-5" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Name */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">Full Name (As per Aadhaar/ID)</label>
                                <input
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`input ${errors.name ? 'input-error' : ''}`}
                                    placeholder="Enter your full name"
                                />
                                {errors.name && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">Email Address</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input ${errors.email ? 'input-error' : ''}`}
                                    placeholder="your@email.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.email}</p>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">Mobile Number</label>
                                <input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`input ${errors.phone ? 'input-error' : ''}`}
                                    placeholder="10-digit mobile number"
                                />
                                {errors.phone && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.phone}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                                        placeholder="Min 6 characters"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gov-500 hover:text-gov-700 dark:hover:text-gov-300">
                                        {showPassword ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.password}</p>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">Confirm Password</label>
                                <input
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="Repeat password"
                                />
                                {errors.confirmPassword && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.confirmPassword}</p>}
                            </div>
                        </div>

                        <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-100 dark:border-primary-800/50 text-sm text-primary-800 dark:text-primary-300">
                            By registering, you agree to the Government's Terms of Service and Privacy Policy for the Road Hazard Reporting Portal.
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isNavigating}
                            className="w-full btn btn-primary py-3.5 text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {(isLoading || isNavigating) ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    {isNavigating ? 'Logging in...' : 'Creating Account...'}
                                </>
                            ) : (
                                'Register as Citizen'
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-sm text-gov-600 dark:text-gov-400">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-primary-700 dark:text-primary-400 hover:underline">
                                    Sign In Here
                                </Link>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex relative w-0 flex-1 bg-gov-gradient items-center justify-center p-12 overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-500" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center max-w-lg"
                >
                    <img src="/margrakshak-logo.webp" alt="Emblem" className="w-24 h-24 rounded-full mx-auto mb-8 shadow-gov-xl border border-white/20" />
                    <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                        Civic Responsibility
                    </h2>
                    <p className="text-lg text-primary-100 leading-relaxed">
                        A registered citizen account helps authorities verify reports, prevent spam, and keep you updated on the resolution progress of hazards you report.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

