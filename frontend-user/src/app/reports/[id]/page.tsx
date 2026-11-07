'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { reportAPI } from '../../../lib/api';
import toast from 'react-hot-toast';

const statusColors: any = {
    submitted: 'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    resolved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

const severityColors: any = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
};

const statusLabels: any = {
    submitted: 'Submitted',
    under_review: 'Under Review',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    rejected: 'Rejected',
};

export default function ReportDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const response = await reportAPI.getReport(id);
            setReport(response.data.report);
            setHistory(response.data.history || []);
        } catch (error: any) {
            console.error('Fetch report error:', error);
            if (error?.response?.status === 404) {
                toast.error('Report not found');
            } else if (error?.response?.status === 403) {
                toast.error('Access denied');
            } else {
                toast.error('Failed to load report');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrls = (): string[] => {
        if (!report) return [];
        const urls = report.image_urls || report.images || [];
        if (typeof urls === 'string') {
            try { return JSON.parse(urls); } catch { return urls ? [urls] : []; }
        }
        return Array.isArray(urls) ? urls : [];
    };

    const getFullImageUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '');
        return `${apiBase}${url}`;
    };

    const getLocationDisplay = () => {
        if (!report) return '';
        const parts = [];
        if (report.address) parts.push(report.address);
        const cityState = [report.city, report.state].filter(Boolean).join(', ');
        if (cityState) parts.push(cityState);
        if (report.pincode) parts.push(`PIN: ${report.pincode}`);
        return parts.join(' • ') || 'Location not specified';
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h2>
                    <p className="text-gray-600 mb-6">This report might have been removed or you don't have access.</p>
                    <Link href="/dashboard" className="btn btn-primary">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const imageUrls = getImageUrls();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition font-medium"
                            >
                                ← Back
                            </button>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Report Details</h1>
                        </div>
                        <span className="font-mono text-sm text-gray-500 dark:text-gray-400">#{id.substring(0, 8)}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                {/* Status & Severity Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6"
                >
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <span className={`px-4 py-1.5 rounded-full font-semibold text-sm ${statusColors[report.status]}`}>
                            {statusLabels[report.status] || report.status}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full font-semibold text-sm ${severityColors[report.severity]}`}>
                            {report.severity?.toUpperCase()} Severity
                        </span>
                        <span className="text-sm text-gray-500 ml-auto">
                            Reported on {new Date(report.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {report.issue_type_name || 'Road Hazard Report'}
                    </h2>

                    {report.description && (
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.description}</p>
                    )}
                </motion.div>

                {/* Location */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6"
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        📍 Location
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{getLocationDisplay()}</p>
                    {report.location_lat && report.location_lng && (
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-500">
                                GPS: {Number(report.location_lat).toFixed(6)}, {Number(report.location_lng).toFixed(6)}
                            </span>
                            <a
                                href={`https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 font-medium"
                            >
                                View on Google Maps →
                            </a>
                        </div>
                    )}
                </motion.div>

                {/* Images */}
                {imageUrls.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            📷 Images ({imageUrls.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {imageUrls.map((url: string, i: number) => (
                                <div
                                    key={i}
                                    className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition"
                                    onClick={() => setLightboxImage(getFullImageUrl(url))}
                                >
                                    <img
                                        src={getFullImageUrl(url)}
                                        alt={`Report image ${i + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzlDQTNBRiIgZm9udC1zaXplPSIxNCI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Admin Response */}
                {report.admin_response && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 border-l-4 border-l-primary-500"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            💬 Admin Response
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{report.admin_response}</p>
                    </motion.div>
                )}

                {/* Status History */}
                {history.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            📋 Status History
                        </h3>
                        <div className="space-y-3">
                            {history.map((entry: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[entry.old_status]}`}>
                                                {statusLabels[entry.old_status] || entry.old_status}
                                            </span>
                                            <span className="text-gray-400">→</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[entry.new_status]}`}>
                                                {statusLabels[entry.new_status] || entry.new_status}
                                            </span>
                                        </div>
                                        {entry.comment && (
                                            <p className="text-sm text-gray-600">{entry.comment}</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {entry.admin_name && `By ${entry.admin_name} • `}
                                            {new Date(entry.changed_at).toLocaleString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Image Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
                        onClick={() => setLightboxImage(null)}
                    >
                        ✕
                    </button>
                    <img
                        src={lightboxImage}
                        alt="Full size"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}

