'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../components/ThemeProvider';
import { useAuthStore } from '../../store/authStore';
import { reportAPI } from '../../lib/api';
import toast from 'react-hot-toast';

interface Report {
    id: string;
    issue_type_name: string;
    severity: string;
    status: string;
    location_lat: number;
    location_lng: number;
    address: string;
    created_at: string;
}

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
    critical: 'text-danger-700',
};

const STATUS_CHART_COLORS: any = {
    submitted: '#2563b8', // gov-primary
    under_review: '#f59e0b', // warning
    in_progress: '#f97316', // gov-saffron
    resolved: '#22c55e', // gov-green
    rejected: '#ef4444', // danger
};

const SEVERITY_CHART_COLORS: any = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
};

export default function DashboardPage() {
    const { user } = useAuthStore();
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const { isDark } = useTheme();

    const gridColor = isDark ? '#374151' : '#f0f0f0';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDark ? '#1f2937' : '#ffffff';
    const tooltipBorder = isDark ? '#374151' : '#f3f4f6';
    const tooltipText = isDark ? '#f3f4f6' : '#111827';

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await reportAPI.getMyReports(params);
            setReports(response.data.reports);
        } catch (error: any) {
            toast.error('Failed to load reports');
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        reports.forEach(r => {
            counts[r.status] = (counts[r.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name: name.replace('_', ' '),
            value,
            color: STATUS_CHART_COLORS[name] || '#6b7280'
        }));
    }, [reports]);

    const severityData = useMemo(() => {
        const counts: Record<string, number> = {};
        reports.forEach(r => {
            counts[r.severity] = (counts[r.severity] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            fill: SEVERITY_CHART_COLORS[name] || '#6b7280'
        }));
    }, [reports]);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
            >
                <h1 className="text-3xl font-bold mb-2">
                    Welcome, {user?.name}! 👋
                </h1>
                <p className="text-gray-600 mb-6">
                    Thank you for making our roads safer. Manage your reports and track their progress here.
                </p>

                <Link href="/submit-report" className="btn btn-primary inline-flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Report New Hazard
                </Link>
                <Link href="/heatmap" className="btn btn-secondary inline-flex items-center ml-3">
                    🗺️ View Hazard Map
                </Link>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Reports', value: reports.length, icon: '📊', color: 'primary' },
                    { label: 'Pending', value: reports.filter(r => r.status === 'submitted' || r.status === 'under_review').length, icon: '⏳', color: 'warning' },
                    { label: 'In Progress', value: reports.filter(r => r.status === 'in_progress').length, icon: '🔄', color: 'info' },
                    { label: 'Resolved', value: reports.filter(r => r.status === 'resolved').length, icon: '✅', color: 'success' },
                ].map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card hover:scale-105 transition-transform"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                                <p className="text-3xl font-bold">{stat.value}</p>
                            </div>
                            <div className="text-4xl">{stat.icon}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            {reports.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Chart */}
                    <div className="card">
                        <h3 className="text-lg font-bold mb-4">Reports by Status</h3>
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? '#1f2937' : '#ffffff'} strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [value, 'Reports']} contentStyle={{ borderRadius: '8px', backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {statusData.map((entry: any, i: number) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{entry.name}: {entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Severity Chart */}
                    <div className="card">
                        <h3 className="text-lg font-bold mb-4">Reports by Severity</h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} className="capitalize" />
                                <YAxis allowDecimals={false} tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value: number) => [value, 'Reports']} cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }} contentStyle={{ borderRadius: '8px', backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
                                    {severityData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Reports List */}
            <div className="card">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold">My Reports</h2>

                    {/* Filter */}
                    <div className="flex flex-wrap gap-2">
                        {['all', 'submitted', 'under_review', 'in_progress', 'resolved'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === status
                                    ? 'bg-primary-600 text-white shadow-md'
                                    : 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600 mt-4">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No reports yet</p>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Start by reporting your first road hazard</p>
                        <Link href="/submit-report" className="btn btn-primary inline-flex items-center">
                            Create First Report
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 transition bg-white dark:bg-gray-800/50"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg">{report.issue_type_name}</h3>
                                            <span className={`badge ${statusColors[report.status]}`}>
                                                {report.status.replace('_', ' ')}
                                            </span>
                                            <span className={`font-semibold ${severityColors[report.severity]}`}>
                                                {report.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-1">
                                            📍 {report.address || `${Number(report.location_lat).toFixed(6)}, ${Number(report.location_lng).toFixed(6)}`}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            Reported on {new Date(report.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <Link
                                        href={`/reports/${report.id}`}
                                        className="btn btn-secondary text-sm"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
