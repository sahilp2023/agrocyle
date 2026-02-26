'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface MapPin {
    id: string;
    lat: number;
    lng: number;
    stage: 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed';
    farmerName: string;
    farmerPhone?: string;
    village?: string;
    cropType: string;
    quantity: number;
    plotName: string;
    areaAcre: number;
    operatorName?: string;
    scheduledDate?: string;
}

interface HubPickupMapProps {
    pins: MapPin[];
    height?: string;
}

const STAGE_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
    pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pending', emoji: '⏳' },
    confirmed: { color: '#6366f1', bg: '#e0e7ff', label: 'Confirmed', emoji: '✅' },
    assigned: { color: '#3b82f6', bg: '#dbeafe', label: 'Assigned', emoji: '🚜' },
    in_progress: { color: '#f97316', bg: '#ffedd5', label: 'In Progress', emoji: '🔄' },
    completed: { color: '#10b981', bg: '#d1fae5', label: 'Completed', emoji: '✔️' },
};

export default function HubPickupMap({ pins, height = '400px' }: HubPickupMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);
    const [filter, setFilter] = useState<string>('all');

    const filteredPins = filter === 'all' ? pins : pins.filter(p => p.stage === filter);

    useEffect(() => {
        if (!mapRef.current) return;

        // Clean up old map
        if (mapInstanceRef.current) {
            (mapInstanceRef.current as { remove: () => void }).remove();
            mapInstanceRef.current = null;
        }

        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Inject CSS
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
                document.head.appendChild(link);
            }

            // Default center (Punjab, India)
            const defaultCenter: [number, number] = [30.7333, 76.7794];
            let center = defaultCenter;
            let zoom = 8;

            if (filteredPins.length > 0) {
                const avgLat = filteredPins.reduce((s, p) => s + p.lat, 0) / filteredPins.length;
                const avgLng = filteredPins.reduce((s, p) => s + p.lng, 0) / filteredPins.length;
                center = [avgLat, avgLng];
                zoom = filteredPins.length === 1 ? 13 : 9;
            }

            const map = L.map(mapRef.current!, {
                center,
                zoom,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Add markers
            filteredPins.forEach(pin => {
                const cfg = STAGE_CONFIG[pin.stage] || STAGE_CONFIG.pending;

                const icon = L.divIcon({
                    html: `<div style="
                        width: 32px; height: 32px;
                        background: ${cfg.color};
                        border: 3px solid white;
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
                        font-size: 14px;
                        cursor: pointer;
                    ">${cfg.emoji}</div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16],
                    popupAnchor: [0, -18],
                });

                const scheduled = pin.scheduledDate
                    ? new Date(pin.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : '';

                L.marker([pin.lat, pin.lng], { icon })
                    .addTo(map)
                    .bindPopup(`
                        <div style="font-family: system-ui; min-width: 180px; padding: 4px 0;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                                <span style="background: ${cfg.bg}; color: ${cfg.color}; 
                                    padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 600;">
                                    ${cfg.label}
                                </span>
                            </div>
                            <strong style="font-size: 13px;">${pin.farmerName}</strong><br/>
                            <span style="font-size: 11px; color: #6b7280;">
                                ${pin.village ? pin.village + ' • ' : ''}${pin.plotName || 'Farm Plot'}
                            </span><br/>
                            <div style="margin-top: 6px; font-size: 11px; color: #374151;">
                                🌾 ${pin.cropType} &nbsp; 📦 ${pin.quantity}T &nbsp; 📐 ${pin.areaAcre.toFixed(1)} acres
                            </div>
                            ${pin.operatorName ? `<div style="margin-top: 4px; font-size: 11px; color: #059669;">🚜 ${pin.operatorName}</div>` : ''}
                            ${scheduled ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">📅 ${scheduled}</div>` : ''}
                            ${pin.farmerPhone ? `<a href="tel:${pin.farmerPhone}" style="font-size: 11px; color: #2563eb; text-decoration: none;">📞 ${pin.farmerPhone}</a>` : ''}
                        </div>
                    `);
            });

            // Fit bounds if multiple pins
            if (filteredPins.length > 1) {
                const bounds = L.latLngBounds(filteredPins.map(p => [p.lat, p.lng]));
                map.fitBounds(bounds, { padding: [40, 40] });
            }

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove: () => void }).remove();
                mapInstanceRef.current = null;
            }
        };
    }, [filteredPins]);

    // Count per stage
    const counts: Record<string, number> = {};
    pins.forEach(p => { counts[p.stage] = (counts[p.stage] || 0) + 1; });

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 pt-4 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">📍 Pickup Locations</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {pins.length} active request{pins.length !== 1 ? 's' : ''} on map
                    </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === 'all'
                                ? 'bg-gray-800 text-white'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        All ({pins.length})
                    </button>
                    {Object.entries(STAGE_CONFIG)
                        .filter(([key]) => key !== 'completed' && (counts[key] || 0) > 0)
                        .map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === key
                                        ? `text-white`
                                        : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                style={filter === key ? { background: cfg.color } : { background: cfg.bg, color: cfg.color }}
                            >
                                {cfg.emoji} {cfg.label} ({counts[key] || 0})
                            </button>
                        ))}
                </div>
            </div>

            {/* Legend */}
            <div className="px-5 pb-2 flex flex-wrap gap-3">
                {Object.entries(STAGE_CONFIG)
                    .filter(([key]) => key !== 'completed')
                    .map(([, cfg]) => (
                        <div key={cfg.label} className="flex items-center gap-1.5 text-xs text-gray-500">
                            <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
                            {cfg.label}
                        </div>
                    ))}
            </div>

            <div ref={mapRef} style={{ height, width: '100%' }} />

            {pins.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80" style={{ position: 'relative', height }}>
                    <div className="text-center text-gray-400">
                        <p className="text-3xl mb-2">🗺️</p>
                        <p className="text-sm">No pickup requests with locations yet</p>
                    </div>
                </div>
            )}
        </div>
    );
}
