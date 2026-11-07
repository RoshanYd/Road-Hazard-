'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { reportAPI } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface HazardLocation {
    id: string;
    lat: number;
    lng: number;
    severity: string;
    issue_type: string;
    status: string;
}

interface ProximitySettings {
    enabled: boolean;
    radius: number; // meters
    sound: boolean;
    vibration: boolean;
}

const DEFAULT_SETTINGS: ProximitySettings = {
    enabled: false,
    radius: 500,
    sound: true,
    vibration: true,
};

/**
 * Haversine formula — calculate distance between two lat/lng points in meters
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function ProximityAlerts() {
    const { user } = useAuthStore();
    const [settings, setSettings] = useState<ProximitySettings>(DEFAULT_SETTINGS);
    const [isTracking, setIsTracking] = useState(false);
    const [nearbyCount, setNearbyCount] = useState(0);
    const [showBanner, setShowBanner] = useState(false);
    const [currentAlert, setCurrentAlert] = useState<HazardLocation | null>(null);
    const hazardsRef = useRef<HazardLocation[]>([]);
    const alertedIdsRef = useRef<Set<string>>(new Set());
    const watchIdRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('MargRakshak-proximity-settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) { /* ignore */ }
        }
    }, []);

    // Save settings to localStorage
    const updateSettings = (newSettings: Partial<ProximitySettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('MargRakshak-proximity-settings', JSON.stringify(updated));
            return updated;
        });
    };

    // Fetch all hazard locations once
    const fetchHazards = useCallback(async () => {
        try {
            const res = await reportAPI.getPublicReports();
            const reports = res.data.reports || [];
            hazardsRef.current = reports
                .filter((r: any) => r.status !== 'resolved' && r.location_lat && r.location_lng)
                .map((r: any) => ({
                    id: r.id,
                    lat: Number(r.location_lat),
                    lng: Number(r.location_lng),
                    severity: r.severity,
                    issue_type: r.issue_type || 'unknown',
                    status: r.status,
                }));
        } catch (e) {
            // Silently fail
        }
    }, []);

    // Play alert sound
    const playAlertSound = useCallback(() => {
        if (!settings.sound) return;
        try {
            // Use a simple beep via AudioContext
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch (e) { /* ignore audio errors */ }
    }, [settings.sound]);

    // Trigger vibration
    const triggerVibration = useCallback(() => {
        if (!settings.vibration) return;
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    }, [settings.vibration]);

    // Check proximity to hazards
    const checkProximity = useCallback((position: GeolocationPosition) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const radius = settings.radius;

        let nearbyHazards = 0;

        for (const hazard of hazardsRef.current) {
            const distance = haversineDistance(userLat, userLng, hazard.lat, hazard.lng);

            if (distance <= radius) {
                nearbyHazards++;

                // Only alert once per hazard
                if (!alertedIdsRef.current.has(hazard.id)) {
                    alertedIdsRef.current.add(hazard.id);

                    const distanceText = distance < 100
                        ? `${Math.round(distance)}m`
                        : `${(distance / 1000).toFixed(1)}km`;

                    const severityEmoji = {
                        critical: '🔴',
                        high: '🟠',
                        medium: '🟡',
                        low: '🟢',
                    }[hazard.severity] || '⚠️';

                    // Show toast
                    toast(
                        `${severityEmoji} ${hazard.severity.toUpperCase()} hazard ${distanceText} ahead!`,
                        {
                            icon: '⚠️',
                            duration: 6000,
                            style: {
                                background: hazard.severity === 'critical' ? '#7f1d1d' : '#1e40af',
                                color: '#fff',
                                fontWeight: 'bold',
                            },
                        }
                    );

                    // Sound & vibration
                    playAlertSound();
                    triggerVibration();

                    // Set current alert for banner
                    setCurrentAlert(hazard);
                    setShowBanner(true);
                    setTimeout(() => setShowBanner(false), 8000);
                }
            }
        }

        setNearbyCount(nearbyHazards);

        // Clear alerted IDs for hazards that are now far away (allow re-alert later)
        alertedIdsRef.current.forEach(id => {
            const hazard = hazardsRef.current.find(h => h.id === id);
            if (hazard) {
                const dist = haversineDistance(userLat, userLng, hazard.lat, hazard.lng);
                if (dist > radius * 2) {
                    alertedIdsRef.current.delete(id);
                }
            }
        });
    }, [settings.radius, playAlertSound, triggerVibration]);

    // Start/stop tracking
    useEffect(() => {
        if (!settings.enabled || !user) {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            setIsTracking(false);
            return;
        }

        // Fetch hazards first
        fetchHazards();

        // Refresh hazards every 5 minutes
        const refreshInterval = setInterval(fetchHazards, 300000);

        // Start watching position
        if ('geolocation' in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                checkProximity,
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    if (error.code === error.PERMISSION_DENIED) {
                        updateSettings({ enabled: false });
                        toast.error('Location permission denied. Proximity alerts disabled.');
                    }
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000,
                }
            );
            setIsTracking(true);
        }

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            clearInterval(refreshInterval);
            setIsTracking(false);
        };
    }, [settings.enabled, user, fetchHazards, checkProximity]);

    if (!user) return null;

    return (
        <>
            {/* Proximity Alert Banner */}
            <AnimatePresence>
                {showBanner && currentAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md"
                    >
                        <div className={`rounded-xl shadow-2xl p-4 flex items-center gap-3 border ${
                            currentAlert.severity === 'critical'
                                ? 'bg-red-900/95 border-red-700 text-white'
                                : 'bg-blue-900/95 border-blue-700 text-white'
                        }`}>
                            <div className="text-3xl animate-pulse">⚠️</div>
                            <div className="flex-1">
                                <p className="font-bold text-sm">
                                    {currentAlert.severity.toUpperCase()} Hazard Nearby!
                                </p>
                                <p className="text-xs opacity-90 mt-0.5">
                                    Drive carefully — reported {currentAlert.issue_type} ahead
                                </p>
                            </div>
                            <button
                                onClick={() => setShowBanner(false)}
                                className="text-white/70 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tracking status indicator (only shows when enabled) */}
            {settings.enabled && (
                <div className="fixed bottom-24 right-6 z-40">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-lg ${
                        isTracking
                            ? 'bg-green-600 text-white'
                            : 'bg-yellow-600 text-white'
                    }`}>
                        <span className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-300 animate-pulse' : 'bg-yellow-300'}`} />
                        {isTracking ? `Scanning • ${nearbyCount} nearby` : 'Starting...'}
                    </div>
                </div>
            )}
        </>
    );
}

// Export settings hook for settings page
export function useProximitySettings() {
    const [settings, setSettings] = useState<ProximitySettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        const saved = localStorage.getItem('MargRakshak-proximity-settings');
        if (saved) {
            try { setSettings(JSON.parse(saved)); } catch (e) { /* ignore */ }
        }
    }, []);

    const update = (newSettings: Partial<ProximitySettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('MargRakshak-proximity-settings', JSON.stringify(updated));
            return updated;
        });
    };

    return { settings, update };
}

