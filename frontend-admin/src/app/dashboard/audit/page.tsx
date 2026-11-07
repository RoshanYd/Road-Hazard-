'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminAuditAPI } from '../../../lib/api';
import { AuditLog } from '../../../types';
import toast from 'react-hot-toast';

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        adminId: '',
    });

    const fetchLogs = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (filters.action) params.action = filters.action;
            if (filters.adminId) params.admin_id = filters.adminId;

            const response = await adminAuditAPI.getAuditLogs(params);
            setLogs(response.data.logs || []);
        } catch (error: any) {
            toast.error('Failed to load audit logs');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({ action: '', adminId: '' });
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="select"
                        >
                            <option value="">All Actions</option>
                            <option value="status_change">Status Change</option>
                            <option value="assignment">Assignment</option>
                            <option value="response">Response Added</option>
                            <option value="delete">Delete Report</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button onClick={clearFilters} className="btn btn-secondary w-full">
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Audit Logs Table */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                        Audit Logs ({logs.length})
                    </h3>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading audit logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600">No audit logs found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Admin</th>
                                    <th>Action</th>
                                    <th>Report ID</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <motion.tr
                                        key={log.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td className="text-sm">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="font-medium">{log.admin_name}</td>
                                        <td>
                                            <span className="badge badge-info">
                                                {log.action.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="font-mono text-xs">
                                            {log.report_id ? `#${log.report_id.substring(0, 8)}` : '-'}
                                        </td>
                                        <td className="text-sm text-gray-600">
                                            {JSON.stringify(log.details)}
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
