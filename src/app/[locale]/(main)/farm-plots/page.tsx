'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { FiPlus, FiArrowLeft, FiSave } from 'react-icons/fi';
import FarmPlotList from '@/components/maps/FarmPlotList';

// Dynamically import FarmMap with no SSR
const FarmMap = dynamic(() => import('@/components/maps/FarmMap.client'), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">Loading Map...</div>
});

export default function FarmPlotsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';

    const [plots, setPlots] = useState<any[]>([]); // Using any for simplicity with complex Types
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');

    // Form State
    const [plotName, setPlotName] = useState('');
    const [currentGeoJSON, setCurrentGeoJSON] = useState<any>(null);
    const [currentArea, setCurrentArea] = useState<number>(0);
    const [editId, setEditId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Toggle between map drawing and manual entry
    const [inputMode, setInputMode] = useState<'map' | 'manual'>('map');
    const [manualAcre, setManualAcre] = useState<string>('');

    useEffect(() => {
        loadPlots();
    }, []);

    const loadPlots = async () => {
        try {
            const token = localStorage.getItem('token');
            // Assuming we need farmerId, but typically token is enough for "my plots"
            // The API we built uses token -> farmerId
            const res = await fetch('/api/farm-plots', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPlots(data.data);
            }
        } catch (error) {
            console.error('Failed to load plots', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!plotName) {
            alert(locale === 'hi' ? 'कृपया नाम भरें' : 'Please provide plot name');
            return;
        }

        // Validate based on input mode
        if (inputMode === 'map' && !currentGeoJSON) {
            alert(locale === 'hi' ? 'कृपया सीमा बनाएं' : 'Please draw the boundary on map');
            return;
        }
        if (inputMode === 'manual' && (!manualAcre || parseFloat(manualAcre) <= 0)) {
            alert(locale === 'hi' ? 'कृपया एकड़ भरें' : 'Please enter valid area in acres');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editId ? `/api/farm-plots/${editId}` : '/api/farm-plots';
            const method = editId ? 'PUT' : 'POST';

            const payload: any = { plotName };
            if (inputMode === 'map') {
                payload.geometry = currentGeoJSON.type === 'Feature' ? currentGeoJSON.geometry : currentGeoJSON;
            } else {
                payload.manualAreaAcre = parseFloat(manualAcre);
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                await loadPlots();
                setViewMode('list');
                resetForm();
            } else {
                alert(data.message || 'Failed to save');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving plot');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(locale === 'hi' ? 'क्या आप सुनिश्चित हैं?' : 'Are you sure?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/farm-plots/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            loadPlots();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (plot: any) => {
        setEditId(plot._id);
        setPlotName(plot.plotName);
        setCurrentGeoJSON(plot.geometry);
        setViewMode('edit');
    };

    const resetForm = () => {
        setPlotName('');
        setCurrentGeoJSON(null);
        setCurrentArea(0);
        setEditId(null);
        setInputMode('map');
        setManualAcre('');
    };

    const handlePlotChanged = (geoJSON: any, areaM2: number) => {
        setCurrentGeoJSON(geoJSON);
        setCurrentArea(areaM2);
    };

    return (
        <div className="safe-area-top pb-24">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 rounded-b-3xl mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {viewMode !== 'list' && (
                            <button onClick={() => setViewMode('list')} className="text-white">
                                <FiArrowLeft className="w-6 h-6" />
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-white">
                            {viewMode === 'list'
                                ? (locale === 'hi' ? 'खेत मानचित्र' : 'Farm Maps')
                                : (viewMode === 'create'
                                    ? (locale === 'hi' ? 'नया खेत' : 'New Plot')
                                    : (locale === 'hi' ? 'खेत बदलें' : 'Edit Plot')
                                )
                            }
                        </h1>
                    </div>
                    {viewMode === 'list' && (
                        <button
                            onClick={() => { resetForm(); setViewMode('create'); }}
                            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"
                        >
                            <FiPlus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-4">
                {viewMode === 'list' ? (
                    loading ? <div className="text-center py-10">Loading...</div> : (
                        <FarmPlotList
                            plots={plots}
                            onEdit={startEdit}
                            onDelete={handleDelete}
                            locale={locale}
                        />
                    )
                ) : (
                    <div className="space-y-6">
                        <Card padding="md">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {locale === 'hi' ? 'खेत का नाम' : 'Plot Name'}
                                </label>
                                <input
                                    type="text"
                                    value={plotName}
                                    onChange={(e) => setPlotName(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder={locale === 'hi' ? 'जैसे: उत्तर वाला खेत' : 'e.g. North Field'}
                                />
                            </div>

                            {/* Toggle between map and manual entry */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {locale === 'hi' ? 'क्षेत्रफल दर्ज करने का तरीका' : 'How to enter area'}
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('map')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${inputMode === 'map'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {locale === 'hi' ? '🗺️ मैप पर बनाएं' : '🗺️ Draw on Map'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('manual')}
                                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${inputMode === 'manual'
                                                ? 'bg-green-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {locale === 'hi' ? '✏️ एकड़ लिखें' : '✏️ Enter Manually'}
                                    </button>
                                </div>
                            </div>

                            {inputMode === 'map' ? (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {locale === 'hi' ? 'सीमा बनाएं' : 'Draw Boundary'}
                                    </label>
                                    <FarmMap
                                        initialGeoJSON={currentGeoJSON}
                                        onPlotChanged={handlePlotChanged}
                                    />
                                    {currentArea > 0 && (
                                        <p className="text-sm text-green-600 mt-2">
                                            {locale === 'hi' ? 'क्षेत्रफल: ' : 'Area: '}
                                            {(currentArea / 4046.8564224).toFixed(2)} {locale === 'hi' ? 'एकड़' : 'acres'}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {locale === 'hi' ? 'क्षेत्रफल (एकड़ में)' : 'Area (in acres)'}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={manualAcre}
                                        onChange={(e) => setManualAcre(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder={locale === 'hi' ? 'जैसे: 2.5' : 'e.g. 2.5'}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {locale === 'hi'
                                            ? 'अपने खेत का क्षेत्रफल एकड़ में लिखें'
                                            : 'Enter your plot area in acres'}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={handleSave}
                                loading={saving}
                                icon={<FiSave />}
                                fullWidth
                            >
                                {locale === 'hi' ? 'सहेजें' : 'Save Plot'}
                            </Button>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
