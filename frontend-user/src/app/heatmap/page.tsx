'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { reportAPI } from '../../lib/api';
import toast from 'react-hot-toast';

// Dynamically import map component (Leaflet doesn't work with SSR)
const MapComponent = dynamic(() => import('../../components/HeatmapMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-600">Loading map...</p>
            </div>
        </div>
    ),
});

interface MapReport {
    id: string;
    location_lat: number;
    location_lng: number;
    severity: string;
    status: string;
    issue_type: string;
}

const severityColors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#7c2d12',
};

export default function HeatmapPage() {
    const [reports, setReports] = useState<MapReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        severity: 'all',
        status: 'all',
    });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await reportAPI.getPublicReports();
            setReports(res.data.reports || []);
        } catch (error) {
            toast.error('Failed to load map data');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredReports = reports.filter(r => {
        if (filters.severity !== 'all' && r.severity !== filters.severity) return false;
        if (filters.status !== 'all' && r.status !== filters.status) return false;
        return true;
    });

    const stats = {
        total: reports.length,
        critical: reports.filter(r => r.severity === 'critical').length,
        high: reports.filter(r => r.severity === 'high').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 z-20">
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                        <img src="/margrakshak-logo.webp" alt="MargRakshak" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-base sm:text-lg font-bold gradient-text">Heatmap</span>
                    </Link>

                    {/* Stats Pills */}
                    <div className="hidden md:flex items-center gap-2">
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1.5 rounded-full">
                            📊 {stats.total} Reports
                        </span>
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold px-3 py-1.5 rounded-full">
                            🔴 {stats.critical + stats.high} High/Critical
                        </span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1.5 rounded-full">
                            ✅ {stats.resolved} Resolved
                        </span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap">
                    <select
                        value={filters.severity}
                        onChange={e => setFilters({ ...filters, severity: e.target.value })}
                        className="text-xs sm:text-sm border dark:border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-200"
                    >
                        <option value="all">All Severity</option>
                        <option value="critical">🔴 Critical</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        className="text-xs sm:text-sm border dark:border-gray-700 rounded-lg px-2 sm:px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-200"
                    >
                        <option value="all">All Status</option>
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <Link href="/dashboard" className="btn btn-primary text-xs sm:text-sm py-1.5 px-3 sm:px-4">
                        ← Dashboard
                    </Link>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-xl font-semibold text-gray-700">Loading Hazard Map...</p>
                            <p className="text-sm text-gray-500 mt-1">Fetching report data</p>
                        </div>
                    </div>
                ) : (
                    <MapComponent reports={filteredReports} />
                )}

                {/* Legend */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 z-[1000]">
                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Severity Legend</p>
                    <div className="space-y-1.5">
                        {Object.entries(severityColors).map(([level, color]) => (
                            <div key={level} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-xs capitalize text-gray-600">{level}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

