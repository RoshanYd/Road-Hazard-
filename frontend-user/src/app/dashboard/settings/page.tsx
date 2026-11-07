'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useProximitySettings } from '../../../components/ProximityAlerts';
import toast from 'react-hot-toast';

export default function SettingsPage() {
    const { settings, update } = useProximitySettings();
    const [sensorEnabled, setSensorEnabled] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('MargRakshak-sensor-enabled');
        setSensorEnabled(saved === 'true');
    }, []);

    const toggleSensor = (val: boolean) => {
        setSensorEnabled(val);
        localStorage.setItem('MargRakshak-sensor-enabled', String(val));
        toast.success(val ? 'Road Scanner enabled' : 'Road Scanner disabled');
    };

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center gap-3 mb-8">
                    <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-2xl font-bold dark:text-white">⚙️ Settings</h1>
                </div>

                {/* Proximity Alerts Section */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold dark:text-white">🗺️ Proximity Alerts</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Get warned when near reported hazards</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={e => {
                                    update({ enabled: e.target.checked });
                                    toast.success(e.target.checked ? 'Proximity alerts enabled' : 'Proximity alerts disabled');
                                }}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                        </label>
                    </div>

                    {settings.enabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="space-y-5 pt-4 border-t dark:border-gray-700"
                        >
                            {/* Alert Radius */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Alert Radius: <span className="text-primary-600 font-bold">{settings.radius}m</span>
                                </label>
                                <input
                                    type="range"
                                    min="100"
                                    max="2000"
                                    step="100"
                                    value={settings.radius}
                                    onChange={e => update({ radius: Number(e.target.value) })}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>100m</span>
                                    <span>1km</span>
                                    <span>2km</span>
                                </div>
                            </div>

                            {/* Sound */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium dark:text-gray-300">🔊 Alert Sound</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Play a beep when hazard detected nearby</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.sound}
                                        onChange={e => update({ sound: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                                </label>
                            </div>

                            {/* Vibration */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium dark:text-gray-300">📳 Vibration</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Vibrate device on proximity alert</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.vibration}
                                        onChange={e => update({ vibration: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                                </label>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Road Scanner (Sensor Detection) Section */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold dark:text-white">🧠 Smart Road Scanner</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Auto-detect potholes via phone sensors while driving</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sensorEnabled}
                                onChange={e => toggleSensor(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                        </label>
                    </div>

                    {sensorEnabled && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="pt-4 border-t dark:border-gray-700"
                        >
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    <strong>How it works:</strong> Your phone's accelerometer detects sudden vertical impacts 
                                    (like driving over a pothole). When detected, your GPS location is captured and an event 
                                    is sent to our servers to help map road quality automatically.
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                    ⚡ Only active when speed {">"} 10 km/h • 🔒 Location shared only on detection • 🔋 Optimized for battery
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* App Info */}
                <div className="card">
                    <h2 className="text-lg font-bold dark:text-white mb-3">ℹ️ About</h2>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>MargRakshak</strong> v2.0 — Road Hazard Reporting Platform</p>
                        <p>📱 Progressive Web App • ⚡ Real-time WebSocket • 🗺️ Proximity Alerts • 🧠 Sensor Detection</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">A Government initiative for safer roads</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

