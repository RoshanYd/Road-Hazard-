'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { reportAPI, aiAPI } from '../../lib/api';
import toast from 'react-hot-toast';

const ISSUE_TYPES = [
    { id: 1, name: 'Pothole', icon: '🕳️' },
    { id: 2, name: 'Broken Street Light', icon: '💡' },
    { id: 3, name: 'Road Crack', icon: '⚡' },
    { id: 4, name: 'Open Manhole', icon: '🚧' },
    { id: 5, name: 'Unsafe Highway', icon: '🛣️' },
    { id: 6, name: 'Speed Breaker Damage', icon: '⚠️' },
];

const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

interface AIClassification {
    hazardType: string;
    issueTypeId: number | null;
    severity: string;
    confidence: number;
    description: string;
}

export default function SubmitReportPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        issue_type_id: '',
        severity: 'medium',
        description: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
    });
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<any>({});

    // AI Classification state
    const [aiResult, setAiResult] = useState<AIClassification | null>(null);
    const [isClassifying, setIsClassifying] = useState(false);
    const [aiApplied, setAiApplied] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: '' });
        }
    };

    // AI Image Classification
    const classifyImage = async (base64: string) => {
        setIsClassifying(true);
        try {
            const response = await aiAPI.classifyImage(base64);
            if (response.data.success) {
                const classification = response.data.classification;
                setAiResult(classification);

                // Auto-fill form fields
                if (classification.issueTypeId) {
                    setFormData(prev => ({
                        ...prev,
                        issue_type_id: classification.issueTypeId.toString(),
                        severity: classification.severity,
                    }));
                    setAiApplied(true);
                    toast.success(`🤖 AI Detected: ${classification.hazardType} (${classification.severity} severity)`, { duration: 4000 });
                }
            }
        } catch (error: any) {
            console.warn('AI classification failed:', error.message);
            // Silently fail - AI is optional
        } finally {
            setIsClassifying(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 5) {
            toast.error('Maximum 5 images allowed');
            return;
        }

        setImages([...images, ...files]);

        // Create previews and trigger AI classification on first image
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImagePreviews(prev => [...prev, base64]);

                // Classify the first image uploaded (or the first new image if none classified yet)
                if (images.length === 0 && index === 0 && !aiResult) {
                    classifyImage(base64);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
        setImagePreviews(imagePreviews.filter((_, i) => i !== index));
        if (images.length <= 1) {
            setAiResult(null);
            setAiApplied(false);
        }
    };

    const getLocation = () => {
        setIsGettingLocation(true);

        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser');
            setIsGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                toast.success('Location captured successfully!');
                setIsGettingLocation(false);
            },
            (error) => {
                toast.error('Failed to get location. Please enter address manually.');
                setIsGettingLocation(false);
            }
        );
    };

    const validate = () => {
        const newErrors: any = {};

        if (!formData.issue_type_id) {
            newErrors.issue_type_id = 'Please select an issue type';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        if (!location && !formData.address) {
            newErrors.location = 'Either capture GPS location or enter address manually';
        }

        if (images.length === 0) {
            newErrors.images = 'At least one image is required';
        }

        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Please fix the errors');
            return;
        }

        setIsSubmitting(true);

        try {
            const reportFormData = new FormData();
            reportFormData.append('issue_type_id', formData.issue_type_id);
            reportFormData.append('severity', formData.severity);
            reportFormData.append('description', formData.description);

            if (location) {
                reportFormData.append('location_lat', location.lat.toString());
                reportFormData.append('location_lng', location.lng.toString());
            }

            if (formData.address) reportFormData.append('address', formData.address);
            if (formData.city) reportFormData.append('city', formData.city);
            if (formData.state) reportFormData.append('state', formData.state);
            if (formData.pincode) reportFormData.append('pincode', formData.pincode);

            images.forEach(image => {
                reportFormData.append('images', image);
            });

            await reportAPI.submit(reportFormData);

            toast.success('Report submitted successfully!');
            router.push('/dashboard');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Failed to submit report';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/dashboard" className="text-primary-600 hover:text-primary-700 inline-flex items-center mb-4">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-2"
                    >
                        Report a Road Hazard
                    </motion.h1>
                    <p className="text-gray-600">Help make our roads safer by reporting hazards in your area.</p>
                </div>

                {/* Form */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="card space-y-6"
                >
                    {/* Images — Moved to top for AI classification */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📸 Upload Images * (Max 5)
                        </label>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative group">
                                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-40 object-cover rounded-lg" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-2 right-2 bg-danger-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition">
                            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-gray-600 mb-1">Click to upload images</p>
                            <p className="text-xs text-gray-400">JPEG, PNG (Max 5MB each)</p>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>
                        {errors.images && (
                            <p className="mt-2 text-sm text-danger-600">{errors.images}</p>
                        )}
                    </div>

                    {/* AI Classification Result */}
                    <AnimatePresence>
                        {isClassifying && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <div>
                                        <p className="font-semibold text-blue-700">🤖 AI is analyzing your image...</p>
                                        <p className="text-sm text-blue-600">Detecting hazard type and severity</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {aiResult && !isClassifying && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-xl">🤖</div>
                                        <div>
                                            <p className="font-bold text-emerald-800 text-lg">AI Classification Result</p>
                                            <div className="mt-2 space-y-1">
                                                <p className="text-sm text-emerald-700">
                                                    <span className="font-medium">Hazard Type:</span>{' '}
                                                    <span className="bg-emerald-200/60 px-2 py-0.5 rounded-full font-semibold">{aiResult.hazardType}</span>
                                                </p>
                                                <p className="text-sm text-emerald-700">
                                                    <span className="font-medium">Severity:</span>{' '}
                                                    <span className={`px-2 py-0.5 rounded-full font-semibold capitalize ${
                                                        aiResult.severity === 'critical' || aiResult.severity === 'high'
                                                            ? 'bg-red-200/60 text-red-800'
                                                            : aiResult.severity === 'medium'
                                                            ? 'bg-yellow-200/60 text-yellow-800'
                                                            : 'bg-green-200/60 text-green-800'
                                                    }`}>{aiResult.severity}</span>
                                                </p>
                                                <p className="text-sm text-emerald-700">
                                                    <span className="font-medium">Confidence:</span> {Math.round(aiResult.confidence * 100)}%
                                                </p>
                                                {aiResult.description && (
                                                    <p className="text-sm text-emerald-600 italic mt-1">"{aiResult.description}"</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {aiApplied && (
                                        <span className="bg-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                                            ✓ Applied
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 text-xs text-emerald-600">
                                    💡 AI has auto-filled the fields below. You can change them if the detection isn't accurate.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Issue Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Issue Type * {aiApplied && <span className="text-emerald-600 text-xs ml-1">(AI suggested)</span>}
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {ISSUE_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, issue_type_id: type.id.toString() })}
                                    className={`p-4 rounded-lg border-2 transition ${formData.issue_type_id === type.id.toString()
                                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{type.icon}</div>
                                    <div className="text-sm font-medium">{type.name}</div>
                                </button>
                            ))}
                        </div>
                        {errors.issue_type_id && (
                            <p className="mt-2 text-sm text-danger-600">{errors.issue_type_id}</p>
                        )}
                    </div>

                    {/* Severity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Severity Level * {aiApplied && <span className="text-emerald-600 text-xs ml-1">(AI suggested)</span>}
                        </label>
                        <div className="flex gap-3">
                            {SEVERITY_LEVELS.map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, severity: level })}
                                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition capitalize ${formData.severity === level
                                        ? level === 'critical' || level === 'high'
                                            ? 'border-danger-500 bg-danger-50 text-danger-700'
                                            : level === 'medium'
                                                ? 'border-warning-500 bg-warning-50 text-warning-700'
                                                : 'border-success-500 bg-success-50 text-success-700'
                                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describe the hazard in detail (minimum 10 characters)..."
                            className="input"
                        />
                        {errors.description && (
                            <p className="mt-2 text-sm text-danger-600">{errors.description}</p>
                        )}
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📍 Location *
                        </label>

                        <div className="flex items-center gap-4 mb-4">
                            <button
                                type="button"
                                onClick={getLocation}
                                disabled={isGettingLocation}
                                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                            >
                                {isGettingLocation ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Getting Location...
                                    </>
                                ) : (
                                    <>📍 Capture GPS Location</>
                                )}
                            </button>

                            {location && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-sm text-success-600 font-medium bg-success-50 px-3 py-1 rounded-full"
                                >
                                    ✓ {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </motion.span>
                            )}
                        </div>

                        <p className="text-sm text-gray-500 mb-3">— or enter address manually —</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Street address"
                                className="input"
                            />
                            <input
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="City"
                                className="input"
                            />
                            <input
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="State"
                                className="input"
                            />
                            <input
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                placeholder="Pincode"
                                className="input"
                            />
                        </div>
                        {errors.location && (
                            <p className="mt-2 text-sm text-danger-600">{errors.location}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="pt-4 border-t">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Submitting Report...
                                </span>
                            ) : (
                                '🚀 Submit Report'
                            )}
                        </button>
                    </div>
                </motion.form>
            </div>
        </div>
    );
}
