'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapReport {
    id: string;
    location_lat: number;
    location_lng: number;
    severity: string;
    status: string;
    issue_type: string;
}

interface HeatmapMapProps {
    reports: MapReport[];
}

const severityColors: Record<string, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#7c2d12',
};

const severityRadius: Record<string, number> = {
    low: 8,
    medium: 10,
    high: 12,
    critical: 14,
};

const statusLabels: Record<string, string> = {
    submitted: '📩 Submitted',
    under_review: '🔍 Under Review',
    in_progress: '🔧 In Progress',
    resolved: '✅ Resolved',
    rejected: '❌ Rejected',
};

export default function HeatmapMap({ reports }: HeatmapMapProps) {
    const mapRef = useRef<L.Map | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Initialize map centered on India
        const map = L.map(containerRef.current, {
            zoomControl: true,
            scrollWheelZoom: true,
        }).setView([20.5937, 78.9629], 5);

        // Add tile layer (dark-themed)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, []);

    // Update markers when reports change
    useEffect(() => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        // Clear existing markers
        map.eachLayer(layer => {
            if (layer instanceof L.CircleMarker) {
                map.removeLayer(layer);
            }
        });

        // Add markers for each report
        const markers: L.CircleMarker[] = [];

        reports.forEach(report => {
            const lat = Number(report.location_lat);
            const lng = Number(report.location_lng);
            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

            const color = severityColors[report.severity] || '#6b7280';
            const radius = severityRadius[report.severity] || 8;

            const marker = L.circleMarker([lat, lng], {
                radius: radius,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.85,
            }).addTo(map);

            // Popup with report info
            const popupContent = `
                <div style="min-width: 200px; font-family: sans-serif;">
                    <div style="font-size: 14px; font-weight: bold; margin-bottom: 6px; color: #1f2937;">
                        ${report.issue_type}
                    </div>
                    <div style="display: flex; gap: 6px; margin-bottom: 8px;">
                        <span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize;">
                            ${report.severity}
                        </span>
                        <span style="background: #f3f4f6; color: #374151; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                            ${statusLabels[report.status] || report.status}
                        </span>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
                        📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}
                    </div>
                    <a href="/reports/${report.id}" 
                       style="display: inline-block; background: #2563eb; color: white; padding: 4px 12px; border-radius: 6px; font-size: 12px; text-decoration: none; font-weight: 500;">
                        View Details →
                    </a>
                </div>
            `;

            marker.bindPopup(popupContent);

            // Hover effect
            marker.on('mouseover', function (this: L.CircleMarker) {
                this.setStyle({ radius: radius + 4, weight: 3 });
            });
            marker.on('mouseout', function (this: L.CircleMarker) {
                this.setStyle({ radius: radius, weight: 2 });
            });

            markers.push(marker);
        });

        // Fit map bounds to markers
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }, [reports]);

    return (
        <div
            ref={containerRef}
            style={{ width: '100%', height: '100%' }}
        />
    );
}
