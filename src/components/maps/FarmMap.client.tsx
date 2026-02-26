'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import * as turf from '@turf/turf';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet's default icon path issues
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FarmMapProps {
    initialGeoJSON?: any;
    onPlotChanged: (geoJSON: any, areaM2: number) => void;
    readonly?: boolean;
}

const FarmMap = ({ initialGeoJSON, onPlotChanged, readonly = false }: FarmMapProps) => {
    const [mapReady, setMapReady] = useState(false);
    const featureGroupRef = useRef<L.FeatureGroup>(null);
    const [areaInfo, setAreaInfo] = useState<{ m2: number; acres: number; ha: number } | null>(null);

    // Effect to load initial GeoJSON
    useEffect(() => {
        if (mapReady && initialGeoJSON && featureGroupRef.current) {
            featureGroupRef.current.clearLayers();
            const layer = L.geoJSON(initialGeoJSON);
            layer.eachLayer((l) => {
                featureGroupRef.current?.addLayer(l);
                // Also update area local state
                const areaM2 = turf.area(initialGeoJSON);
                setAreaInfo({
                    m2: areaM2,
                    acres: areaM2 / 4046.8564224,
                    ha: areaM2 / 10000
                });
            });

            // Fit bounds if layer exists
            if (layer.getBounds().isValid()) {
                // accessing map instance via state or context is tricky here without useMap
                // But we can trigger a fitBounds if we had access to map instance.
                // For now, let's just render.
            }
        }
    }, [mapReady, initialGeoJSON]);

    const _onCreated = (e: any) => {
        const layer = e.layer;

        // Ensure only one polygon
        if (featureGroupRef.current) {
            const layers = featureGroupRef.current.getLayers();
            if (layers.length > 1) {
                // Remove older layers, keep the new one
                layers.forEach((l) => {
                    if (l !== layer) featureGroupRef.current?.removeLayer(l as L.Layer);
                });
            }
        }

        updateGeometry();
    };

    const _onEdited = (e: any) => {
        updateGeometry();
    };

    const _onDeleted = (e: any) => {
        updateGeometry();
    };

    const updateGeometry = () => {
        if (!featureGroupRef.current) return;

        const layers = featureGroupRef.current.getLayers();
        if (layers.length === 0) {
            onPlotChanged(null, 0);
            setAreaInfo(null);
            return;
        }

        // Assuming single polygon
        const layer = layers[0] as L.Polygon;
        const geoJSON = layer.toGeoJSON();
        const areaM2 = turf.area(geoJSON);

        setAreaInfo({
            m2: areaM2,
            acres: areaM2 / 4046.8564224,
            ha: areaM2 / 10000
        });

        onPlotChanged(geoJSON, areaM2);
    };

    // Component to center map on locate
    const LocateEffect = () => {
        const map = useMap();
        useEffect(() => {
            if (initialGeoJSON) {
                const layer = L.geoJSON(initialGeoJSON);
                if (layer.getBounds().isValid()) {
                    map.fitBounds(layer.getBounds());
                }
            } else {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        const { latitude, longitude } = pos.coords;
                        map.setView([latitude, longitude], 16);
                    });
                }
            }
            setMapReady(true);
        }, [map]);
        return null;
    };

    // Search/pincode control — renders inside MapContainer to access useMap()
    const SearchControl = () => {
        const map = useMap();
        const [query, setQuery] = useState('');
        const [searching, setSearching] = useState(false);
        const [searchError, setSearchError] = useState('');
        const markerRef = useRef<L.Marker | null>(null);

        const handleSearch = async () => {
            if (!query.trim()) return;
            setSearching(true);
            setSearchError('');
            try {
                // Use Nominatim free geocoding, scoped to India
                const encoded = encodeURIComponent(query.trim());
                const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&countrycodes=in&format=json&limit=1&addressdetails=1`;
                const res = await fetch(url, {
                    headers: { 'Accept-Language': 'en' },
                });
                const results = await res.json();
                if (results.length > 0) {
                    const { lat, lon, display_name } = results[0];
                    const latNum = parseFloat(lat);
                    const lonNum = parseFloat(lon);

                    // Fly to location
                    map.flyTo([latNum, lonNum], 15, { duration: 1.5 });

                    // Remove old search marker
                    if (markerRef.current) {
                        map.removeLayer(markerRef.current);
                    }

                    // Add temporary marker
                    const searchIcon = L.divIcon({
                        html: `<div style="
                            width: 28px; height: 28px;
                            background: #ef4444;
                            border: 3px solid white;
                            border-radius: 50%;
                            display: flex; align-items: center; justify-content: center;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
                            font-size: 12px;
                        ">📍</div>`,
                        className: '',
                        iconSize: [28, 28],
                        iconAnchor: [14, 14],
                    });

                    const marker = L.marker([latNum, lonNum], { icon: searchIcon })
                        .addTo(map)
                        .bindPopup(`<div style="font-family:system-ui; font-size:12px; max-width:200px;"><strong>${display_name}</strong></div>`)
                        .openPopup();
                    markerRef.current = marker;

                    // Auto-remove marker after 10s
                    setTimeout(() => {
                        if (markerRef.current === marker) {
                            map.removeLayer(marker);
                            markerRef.current = null;
                        }
                    }, 10000);
                } else {
                    setSearchError('Location not found');
                }
            } catch {
                setSearchError('Search failed');
            } finally {
                setSearching(false);
            }
        };

        return (
            <div style={{
                position: 'absolute', top: 10, left: 50, right: 50, zIndex: 1000,
                display: 'flex', gap: '4px',
            }}>
                <input
                    type="text"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setSearchError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Search village, city or pincode..."
                    style={{
                        flex: 1, padding: '8px 12px', fontSize: '13px',
                        border: searchError ? '2px solid #ef4444' : '2px solid #16a34a',
                        borderRadius: '8px', outline: 'none',
                        background: 'white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={searching || !query.trim()}
                    style={{
                        padding: '8px 14px', fontSize: '13px', fontWeight: 600,
                        background: searching ? '#9ca3af' : '#16a34a',
                        color: 'white', border: 'none', borderRadius: '8px',
                        cursor: searching ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {searching ? '...' : '🔍'}
                </button>
            </div>
        );
    };

    return (
        <div className="space-y-2">
            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-300 relative z-0">
                <MapContainer
                    center={[20.5937, 78.9629]} // Center of India
                    zoom={5}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FeatureGroup ref={featureGroupRef}>
                        {!readonly && (
                            <EditControl
                                position="topright"
                                onCreated={_onCreated}
                                onEdited={_onEdited}
                                onDeleted={_onDeleted}
                                draw={{
                                    rectangle: false,
                                    circle: false,
                                    circlemarker: false,
                                    marker: false,
                                    polyline: false,
                                    polygon: {
                                        allowIntersection: false,
                                        drawError: {
                                            color: '#e1e100', // Color the shape will turn when intersects
                                            message: '<strong>Error:</strong> shape edges cannot cross!' // Message that will show when intersect
                                        },
                                        shapeOptions: {
                                            color: '#16a34a'
                                        }
                                    },
                                }}
                            />
                        )}
                    </FeatureGroup>
                    <LocateEffect />
                    <SearchControl />
                </MapContainer>
            </div>

            {areaInfo && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex flex-wrap gap-4 text-sm text-green-800">
                    <div>
                        <span className="font-bold">Area:</span> {areaInfo.acres.toFixed(2)} Acres
                    </div>
                    <div className="text-green-600">
                        ({areaInfo.ha.toFixed(2)} Hectares / {areaInfo.m2.toFixed(0)} m²)
                    </div>
                    <div className="w-full text-xs text-green-600 mt-1">
                        * Area is approximate based on boundary drawn.
                    </div>
                </div>
            )}

            <button
                type="button"
                onClick={(e) => {
                    e.preventDefault();
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(pos => {
                            // We can't easily access map instance here to flyTo unless we use a context or reference exposed.
                            // For simplicity, we just rely on LocateEffect or external control if we need to recenter later.
                            // But ideally `LocateEffect` runs once. 
                            // Let's rely on user panning or improve this if needed.
                            const event = new CustomEvent('map:locate', { detail: pos.coords });
                            window.dispatchEvent(event);
                        })
                    }
                }}
                className="text-xs text-green-600 underline"
            >
                Locate Me (Reset View)
            </button>
        </div>
    );
};

export default FarmMap;
