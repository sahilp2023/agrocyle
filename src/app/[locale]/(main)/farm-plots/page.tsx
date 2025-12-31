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
        if (!plotName || !currentGeoJSON) {
            alert(locale === 'hi' ? 'कृपया नाम और सीमा भरें' : 'Please provide name and boundary');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editId ? `/api/farm-plots/${editId}` : '/api/farm-plots';
            const method = editId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    plotName,
                    geometry: currentGeoJSON.type === 'Feature' ? currentGeoJSON.geometry : currentGeoJSON
                })
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

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {locale === 'hi' ? 'सीमा बनाएं' : 'Draw Boundary'}
                                </label>
                                <FarmMap
                                    initialGeoJSON={currentGeoJSON}
                                    onPlotChanged={handlePlotChanged}
                                />
                            </div>

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
