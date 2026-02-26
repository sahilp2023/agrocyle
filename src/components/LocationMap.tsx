'use client';

import React, { useEffect, useRef } from 'react';

interface LocationMapProps {
    lat: number;
    lng: number;
    label?: string;
    height?: string;
}

export default function LocationMap({ lat, lng, label, height = '288px' }: LocationMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<unknown>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Dynamic import to avoid SSR issues
        const initMap = async () => {
            const L = (await import('leaflet')).default;

            // Inject Leaflet CSS via link tag
            if (!document.querySelector('link[href*="leaflet"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
                document.head.appendChild(link);
            }

            // Fix default marker icon path
            delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!, {
                center: [lat, lng],
                zoom: 14,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Custom green marker for operator
            const operatorIcon = L.divIcon({
                html: `<div style="
                    width: 36px; height: 36px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    border: 3px solid white;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    font-size: 16px;
                ">🚜</div>`,
                className: '',
                iconSize: [36, 36],
                iconAnchor: [18, 18],
                popupAnchor: [0, -20],
            });

            L.marker([lat, lng], { icon: operatorIcon })
                .addTo(map)
                .bindPopup(`
                    <div style="font-family: system-ui; text-align: center; padding: 4px 0;">
                        <strong style="font-size: 14px;">${label || 'Operator Location'}</strong><br/>
                        <span style="font-size: 11px; color: #059669;">● Live Tracking</span><br/>
                        <span style="font-size: 11px; color: #6b7280;">${lat.toFixed(4)}, ${lng.toFixed(4)}</span>
                    </div>
                `)
                .openPopup();

            // Pulsing circle around operator
            L.circle([lat, lng], {
                radius: 200,
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.1,
                weight: 1,
            }).addTo(map);

            mapInstanceRef.current = map;
        };

        initMap();

        return () => {
            if (mapInstanceRef.current) {
                (mapInstanceRef.current as { remove: () => void }).remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, label]);

    return <div ref={mapRef} style={{ height, width: '100%' }} />;
}
