'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { adminDashboardAPI } from '../../lib/api';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS: any = {
    submitted: '#3b82f6',
    under_review: '#f59e0b',
    in_progress: '#6366f1',
    resolved: '#22c55e',
    rejected: '#ef4444',
};

const SEVERITY_COLORS: any = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
};

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === 'system' ? systemTheme : theme;
    const isDark = currentTheme === 'dark';

    const gridColor = isDark ? '#374151' : '#f0f0f0';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const tooltipBg = isDark ? '#1f2937' : '#ffffff';
    const tooltipBorder = isDark ? '#374151' : '#f3f4f6';
    const tooltipText = isDark ? '#f3f4f6' : '#111827';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, trendsRes] = await Promise.all([
                adminDashboardAPI.getStats(),
                adminDashboardAPI.getTrends({ days: 30 }),
            ]);
            setData(statsRes.data);
            setTrends(trendsRes.data.trends || []);
        } catch (error: any) {
            toast.error('Failed to load dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const users = data?.users || {};
    const resTime = data?.resolutionTime || {};
    const monthly = data?.monthlyComparison || {};

    const monthChange = Number(monthly.last_month) > 0
        ? Math.round(((Number(monthly.current_month) - Number(monthly.last_month)) / Number(monthly.last_month)) * 100)
        : 0;

    const statusData = (data?.byStatus || []).map((s: any) => ({
        name: s.status?.toLowerCase().replace('_', ' '),
        value: Number(s.count),
        color: COLORS[s.status?.toLowerCase()] || '#6b7280',
    })).filter((d: any) => d.value > 0);

    const totalReports = statusData.reduce((sum: number, d: any) => sum + d.value, 0);

    const severityData = (data?.bySeverity || []).map((s: any) => ({
        name: s.severity?.toLowerCase() || 'unknown',
        value: Number(s.count),
        fill: SEVERITY_COLORS[s.severity?.toLowerCase()] || '#6b7280',
    })).filter((d: any) => d.value > 0);

    const issueTypeData = (data?.byIssueType || []).filter((i: any) => Number(i.count) > 0);

    const trendData = trends.map((t: any) => ({
        date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        total: Number(t.total),
        resolved: Number(t.resolved),
        critical: Number(t.critical || 0),
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">Overview of road hazard reports</p>
                </div>
                <button onClick={fetchData} className="btn btn-secondary text-sm py-2 px-4">
                    🔄 Refresh
                </button>
            </div>

            {/* Stat Cards Row 1 - Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Total Reports', value: Number(stats.total_reports) || 0, icon: '📊', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
                    { label: 'This Week', value: Number(stats.this_week) || 0, icon: '📅', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400' },
                    { label: 'Pending', value: Number(stats.submitted) || 0, icon: '⏳', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
                    { label: 'In Progress', value: Number(stats.in_progress) || 0, icon: '🔄', bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-400' },
                    { label: 'Resolved', value: Number(stats.resolved) || 0, icon: '✅', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400' },
                    { label: 'Critical', value: Number(stats.critical_count) || 0, icon: '🚨', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`${stat.bg} rounded-xl p-4 border border-white/50`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500">{stat.label}</span>
                            <span className="text-lg">{stat.icon}</span>
                        </div>
                        <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Row 2 - Resolution Time & Users & Monthly */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                    className="card bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border-teal-100 dark:border-teal-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⏱️</span>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Resolution Time</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-teal-700 dark:text-teal-400">{resTime.avg_hours || '—'}<span className="text-sm font-normal ml-1">hrs avg</span></p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>Min: {resTime.min_hours || '—'}h</span>
                        <span>Max: {resTime.max_hours || '—'}h</span>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
                    className="card bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-100 dark:border-violet-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👥</span>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Users</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-violet-700 dark:text-violet-400">{Number(users.total_users) || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">+{Number(users.new_users_month) || 0} new this month</p>
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-100 dark:border-orange-800/50">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📈</span>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200">Monthly Trend</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-orange-700 dark:text-orange-400">{Number(monthly.current_month) || 0}</p>
                    <p className={`text-xs mt-2 font-medium ${monthChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {monthChange >= 0 ? `↑ ${monthChange}%` : `↓ ${Math.abs(monthChange)}%`} vs last month ({Number(monthly.last_month) || 0})
                    </p>
                </motion.div>
            </div>

            {/* Row 3 - Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Distribution Donut */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Reports by Status</h3>
                    {statusData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                                        {statusData.map((entry: any, i: number) => (
                                            <Cell key={i} fill={entry.color} stroke={isDark ? '#1f2937' : '#ffffff'} strokeWidth={2} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => [value, 'Reports']} contentStyle={{ borderRadius: '8px', backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap justify-center gap-3 mt-2">
                                {statusData.map((entry: any, i: number) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        <span className="text-xs text-gray-600 capitalize">{entry.name}: {entry.value} ({Math.round((entry.value / totalReports) * 100)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">No data</div>
                    )}
                </div>

                {/* Severity Bar Chart */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Reports by Severity</h3>
                    {severityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={severityData} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 13 }} className="capitalize" axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: textColor, fontSize: 13 }} axisLine={false} tickLine={false} />
                                <Tooltip formatter={(value: number) => [value, 'Reports']} cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }} contentStyle={{ borderRadius: '8px', backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {severityData.map((entry: any, i: number) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-8 text-gray-400">No data</div>
                    )}
                </div>
            </div>

            {/* Trend Area Chart */}
            {trendData.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">📈 Report Trends (Last 30 Days)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: textColor }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} />
                            <Legend wrapperStyle={{ color: textColor }} />
                            <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total" />
                            <Area type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" name="Resolved" />
                            <Area type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} fillOpacity={0.1} fill="#ef444420" name="Critical" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Row 4 - Issue Types + High Risk Zones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Issue Types */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔧 Reports by Issue Type</h3>
                    <div className="space-y-3">
                        {issueTypeData.map((item: any, i: number) => {
                            const pct = totalReports > 0 ? Math.round((Number(item.count) / totalReports) * 100) : 0;
                            return (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">{item.name}</span>
                                        <span className="text-gray-500">{item.count} ({pct}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className="bg-primary-500 h-2.5 rounded-full"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* High Risk Zones */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">🔥 High Risk Zones</h3>
                    {(data?.highRiskZones || []).length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-2 font-medium">#</th>
                                        <th className="pb-2 font-medium">City</th>
                                        <th className="pb-2 font-medium">State</th>
                                        <th className="pb-2 font-medium text-right">Reports</th>
                                        <th className="pb-2 font-medium text-right">Critical</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(data?.highRiskZones || []).map((zone: any, i: number) => (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="py-2 text-gray-400">{i + 1}</td>
                                            <td className="py-2 font-medium text-gray-800">{zone.city || '—'}</td>
                                            <td className="py-2 text-gray-600">{zone.state || '—'}</td>
                                            <td className="py-2 text-right font-bold text-gray-800">{zone.report_count}</td>
                                            <td className="py-2 text-right">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${Number(zone.critical_reports) > 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                                    {zone.critical_reports || 0}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">No location data available</div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/dashboard/reports?status=submitted" className="btn btn-primary">📋 View Pending Reports</Link>
                    <Link href="/dashboard/reports" className="btn btn-secondary">🔍 Search All Reports</Link>
                    <Link href="/dashboard/audit" className="btn btn-secondary">📝 View Audit Logs</Link>
                </div>
            </div>
        </div>
    );
}
