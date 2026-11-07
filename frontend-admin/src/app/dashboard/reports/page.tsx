'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { adminReportAPI } from '../../../lib/api';
import { Report } from '../../../types';
import toast from 'react-hot-toast';

const statusColors: any = {
    submitted: 'badge-info',
    under_review: 'badge-warning',
    in_progress: 'badge-warning',
    resolved: 'badge-success',
    rejected: 'badge-danger',
};

const severityColors: any = {
    low: 'text-success-600',
    medium: 'text-warning-600',
    high: 'text-danger-500',
    critical: 'text-danger-700 font-bold',
};

function ReportsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || '',
        severity: '',
        search: '',
    });

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (filters.status) params.status = filters.status;
            if (filters.severity) params.severity = filters.severity;
            if (filters.search) params.search = filters.search;

            const response = await adminReportAPI.getReports(params);
            setReports(response.data.reports || []);
        } catch (error: any) {
            toast.error('Failed to load reports');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({ status: '', severity: '', search: '' });
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="select"
                        >
                            <option value="">All Statuses</option>
                            <option value="submitted">Submitted</option>
                            <option value="under_review">Under Review</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Severity</label>
                        <select
                            value={filters.severity}
                            onChange={(e) => handleFilterChange('severity', e.target.value)}
                            className="select"
                        >
                            <option value="">All Severities</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Search by location..."
                            className="input"
                        />
                    </div>

                    <div className="flex items-end">
                        <button onClick={clearFilters} className="btn btn-secondary w-full">
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Reports ({reports.length})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">No reports found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Issue Type</th>
                                    <th>Location</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                    <th>Reporter</th>
                                    <th>Assigned To</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((report) => (
                                    <motion.tr
                                        key={report.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td className="font-mono text-xs">
                                            #{report.id.substring(0, 8)}
                                        </td>
                                        <td className="font-medium">{report.issue_type_name}</td>
                                        <td className="text-sm">{[report.city, report.state].filter(Boolean).join(', ') || 'N/A'}</td>
                                        <td>
                                            <span className={`font-semibold ${severityColors[report.severity]}`}>
                                                {report.severity.toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${statusColors[report.status]}`}>
                                                {report.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-sm">{report.user_name}</td>
                                        <td className="text-sm">
                                            {report.assigned_to_name || (
                                                <span className="text-gray-400">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="text-sm">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <Link
                                                href={`/dashboard/reports/${report.id}`}
                                                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium text-sm"
                                            >
                                                View →
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading reports...</p>
            </div>
        }>
            <ReportsContent />
        </Suspense>
    );
}
