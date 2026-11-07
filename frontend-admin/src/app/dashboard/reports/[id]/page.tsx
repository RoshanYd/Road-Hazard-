'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { adminReportAPI } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import toast from 'react-hot-toast';

const statusColors: any = {
    submitted: 'badge-info',
    under_review: 'badge-warning',
    in_progress: 'badge-warning',
    resolved: 'badge-success',
    rejected: 'badge-danger',
};

export default function ReportDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user } = useAuthStore();
    const [report, setReport] = useState<any>(null);
    const [statusHistory, setStatusHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [newStatus, setNewStatus] = useState('');
    const [responseMessage, setResponseMessage] = useState('');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const res = await adminReportAPI.getReport(params.id);
            setReport(res.data.report);
            setStatusHistory(res.data.statusHistory || []);
            setNewStatus(res.data.report.status);
        } catch (error: any) {
            toast.error('Failed to load report');
            router.push('/dashboard/reports');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!newStatus || newStatus === report?.status) {
            toast.error('Please select a different status');
            return;
        }

        setIsUpdating(true);
        try {
            await adminReportAPI.updateStatus(params.id, { status: newStatus });
            toast.success('Status updated successfully');
            fetchReport();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleAddResponse = async () => {
        if (!responseMessage.trim()) {
            toast.error('Please enter a response');
            return;
        }

        setIsUpdating(true);
        try {
            // Backend expects { message: "..." } not { response: "..." }
            await adminReportAPI.addResponse(params.id, { message: responseMessage.trim() });
            toast.success('Response added successfully');
            setResponseMessage('');
            fetchReport();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add response');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            return;
        }

        try {
            await adminReportAPI.deleteReport(params.id);
            toast.success('Report deleted successfully');
            router.push('/dashboard/reports');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete report');
        }
    };

    // Build location display string
    const getLocationDisplay = () => {
        if (!report) return '';
        const parts = [];
        if (report.address) parts.push(report.address);
        const cityState = [report.city, report.state].filter(Boolean).join(', ');
        if (cityState) parts.push(cityState);
        if (report.pincode) parts.push(`PIN: ${report.pincode}`);
        return parts.join(' • ') || 'Location not specified';
    };

    // Get image URLs - DB stores as image_urls (PostgreSQL text array)
    const getImageUrls = (): string[] => {
        if (!report) return [];
        const urls = report.image_urls || report.images || [];
        if (typeof urls === 'string') {
            try { return JSON.parse(urls); } catch { return [urls]; }
        }
        return Array.isArray(urls) ? urls : [];
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading report...</p>
                </div>
            </div>
        );
    }

    if (!report) {
        return <div>Report not found</div>;
    }

    const canDelete = user?.role === 'manager' || user?.role === 'super_admin';
    const imageUrls = getImageUrls();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

    return (
        <div className="space-y-6">
            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <div className="relative max-w-4xl max-h-[90vh]">
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-10 right-0 text-white text-2xl hover:text-gray-300"
                        >
                            ✕ Close
                        </button>
                        <img
                            src={selectedImage.startsWith('http') ? selectedImage : `${apiBaseUrl}${selectedImage}`}
                            alt="Report image full view"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="text-gray-600 hover:text-gray-900 mb-2 flex items-center text-sm"
                    >
                        ← Back to Reports
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Report #{report.id.substring(0, 8)}</h1>
                </div>
                {canDelete && (
                    <button onClick={handleDelete} className="btn btn-danger">
                        Delete Report
                    </button>
                )}
            </div>

            {/* Report Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Report Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Issue Type</p>
                                <p className="font-medium">{report.issue_type_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Severity</p>
                                <p className="font-medium text-danger-600">{report.severity?.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`badge ${statusColors[report.status]}`}>
                                    {report.status?.replace('_', ' ')}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Submitted On</p>
                                <p className="font-medium">{new Date(report.created_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📍 Location</h3>
                        <div className="space-y-3">
                            <p className="font-medium text-gray-800">{getLocationDisplay()}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Latitude: <strong>{Number(report.location_lat).toFixed(6)}</strong></span>
                                <span>Longitude: <strong>{Number(report.location_lng).toFixed(6)}</strong></span>
                            </div>
                            <a
                                href={`https://www.google.com/maps?q=${report.location_lat},${report.location_lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary-600 hover:text-primary-800 text-sm font-medium"
                            >
                                🗺️ View on Google Maps →
                            </a>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                        <p className="text-gray-700 whitespace-pre-wrap">{report.description}</p>
                    </div>

                    {/* Images */}
                    {imageUrls.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">📷 Images ({imageUrls.length})</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {imageUrls.map((imageUrl: string, index: number) => {
                                    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${apiBaseUrl}${imageUrl}`;
                                    return (
                                        <div
                                            key={index}
                                            className="relative group cursor-pointer"
                                            onClick={() => setSelectedImage(imageUrl)}
                                        >
                                            <img
                                                src={fullUrl}
                                                alt={`Report image ${index + 1}`}
                                                className="w-full h-40 object-cover rounded-lg border border-gray-200 group-hover:opacity-80 transition"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition flex items-center justify-center">
                                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm">
                                                    🔍 Click to enlarge
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Admin Response */}
                    {report.admin_response && (
                        <div className="card bg-blue-50 border-blue-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">💬 Admin Response</h3>
                            <p className="text-gray-700 whitespace-pre-wrap">{report.admin_response}</p>
                        </div>
                    )}

                    {/* Status History */}
                    {statusHistory.length > 0 && (
                        <div className="card">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Status History</h3>
                            <div className="space-y-3">
                                {statusHistory.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`badge ${statusColors[entry.old_status] || 'badge-gray'}`}>
                                                    {entry.old_status?.replace('_', ' ')}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className={`badge ${statusColors[entry.new_status]}`}>
                                                    {entry.new_status?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            {entry.comment && (
                                                <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                by {entry.changed_by_name || 'System'} • {new Date(entry.changed_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Reporter Info */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Reporter</h3>
                        <div className="space-y-2">
                            <p className="font-medium">{report.user_name}</p>
                            <p className="text-sm text-gray-600">{report.user_email}</p>
                            {report.user_phone && (
                                <p className="text-sm text-gray-600">📞 {report.user_phone}</p>
                            )}
                        </div>
                    </div>

                    {/* Assignment */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Assignment</h3>
                        <p className="text-sm text-gray-600">Assigned To</p>
                        <p className="font-medium">
                            {report.assigned_admin_name || report.assigned_to_name || (
                                <span className="text-gray-400">Not assigned</span>
                            )}
                        </p>
                        {report.assigned_department && (
                            <>
                                <p className="text-sm text-gray-600 mt-2">Department</p>
                                <p className="font-medium">{report.assigned_department}</p>
                            </>
                        )}
                    </div>

                    {/* Update Status */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
                        <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="select mb-3"
                        >
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <button
                            onClick={handleStatusUpdate}
                            disabled={isUpdating || newStatus === report.status}
                            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>

                    {/* Add Response */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Add Response</h3>
                        <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="Enter your response to the reporter (min 10 characters)..."
                            className="input min-h-[100px] mb-3"
                        />
                        <button
                            onClick={handleAddResponse}
                            disabled={isUpdating || !responseMessage.trim() || responseMessage.trim().length < 10}
                            className="btn btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? 'Adding...' : 'Add Response'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

