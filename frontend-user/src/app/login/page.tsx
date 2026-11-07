'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import ThemeToggle from '../../components/ThemeToggle';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        email: '',
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
        if (!formData.email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.password) newErrors.password = 'Password is required';
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
            await login(formData.email, formData.password);
            setIsNavigating(true);
            router.push('/dashboard');
        } catch (error) {
            setIsNavigating(false);
            // Error is handled by store
        }
    };

    return (
        <div className="min-h-screen flex bg-gov-50 dark:bg-gov-950 font-sans">
            {/* Left Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white dark:bg-gov-900 border-r border-gov-200 dark:border-gov-800 relative z-10 py-12">
                <div className="absolute top-8 left-8 right-8 flex items-center justify-between">
                    <Link href="/" className="inline-flex items-center space-x-2 group">
                        <svg className="w-5 h-5 text-gov-500 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-sm font-medium text-gov-500 group-hover:text-primary-600 transition-colors">Back to Home</span>
                    </Link>
                    <ThemeToggle />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md w-full mx-auto space-y-8"
                >
                    <div className="text-center">
                        <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-16 h-16 rounded-xl mx-auto mb-6 shadow-gov" />
                        <h2 className="text-3xl font-extrabold text-gov-900 dark:text-white">
                            Citizen Login
                        </h2>
                        <p className="mt-2 text-gov-600 dark:text-gov-400">
                            Sign in to access the Road Hazard Reporting Portal
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gov-700 dark:text-gov-300 mb-1">
                                    Email Address
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`input ${errors.email ? 'input-error' : ''}`}
                                    placeholder="Enter your email"
                                />
                                {errors.email && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.email}</p>}
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gov-700 dark:text-gov-300">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <input
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
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gov-500 hover:text-gov-700 dark:hover:text-gov-300 transition"
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
                                {errors.password && <p className="mt-1 text-sm text-danger-600 dark:text-danger-400">{errors.password}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || isNavigating}
                            className="w-full btn btn-primary py-3.5 text-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {(isLoading || isNavigating) ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    {isNavigating ? 'Redirecting...' : 'Authenticating...'}
                                </>
                            ) : (
                                'Sign In to Portal'
                            )}
                        </button>

                        <div className="text-center space-y-2">
                            <p className="text-sm text-gov-600 dark:text-gov-400">
                                Need to report a hazard but don't have an account?{' '}
                                <Link href="/register" className="font-semibold text-primary-700 dark:text-primary-400 hover:underline">
                                    Register Here
                                </Link>
                            </p>
                            <p className="text-xs text-gov-500 dark:text-gov-400 pt-2 border-t border-gov-100 dark:border-gov-800">
                                Civic Authority or Department Official?{' '}
                                <a href="http://localhost:3001/login" className="font-semibold text-accent-600 dark:text-accent-400 hover:underline">
                                    Sign In to Admin Portal →
                                </a>
                            </p>
                        </div>
                    </form>
                </motion.div>
            </div>

            {/* Right Side - Branding */}
            <div className="hidden lg:flex relative w-0 flex-1 bg-gov-gradient items-center justify-center p-12 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                        backgroundSize: '40px 40px'
                    }} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-accent-500" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 text-center max-w-lg"
                >
                    <div className="w-24 h-24 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/30 shadow-gov-xl p-3">
                        <img
                            src="/margrakshak-logo.webp"
                            alt="MargRakshak Emblem"
                            className="w-full h-full rounded-xl object-cover shadow"
                        />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-6 leading-tight">
                        Empowering Citizens for Safer Roads
                    </h2>
                    <p className="text-lg text-primary-100 leading-relaxed mb-10">
                        Join the nationwide initiative to identify and eliminate road hazards. Your active participation helps authorities maintain world-class road infrastructure.
                    </p>
                    
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-left">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 text-white">1</div>
                            <div>
                                <h4 className="font-bold text-white">Capture</h4>
                                <p className="text-sm text-primary-100">Take photos of the hazard clearly.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 text-white">2</div>
                            <div>
                                <h4 className="font-bold text-white">Report</h4>
                                <p className="text-sm text-primary-100">Submit details with GPS coordinates.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center flex-shrink-0 text-white">3</div>
                            <div>
                                <h4 className="font-bold text-white">Resolve</h4>
                                <p className="text-sm text-primary-100">Authorities take action and update status.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

