'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Card, IconSelector, Slider, Input } from '@/components/ui';
import { FiPlus, FiMapPin, FiTrash2, FiEdit2, FiX } from 'react-icons/fi';

// Translations
const t = {
    hi: {
        title: 'मेरे खेत',
        addFarm: 'खेत जोड़ें',
        editFarm: 'खेत बदलें',
        farmName: 'खेत का नाम',
        farmNamePlaceholder: 'जैसे उत्तरी खेत',
        cropType: 'फसल का प्रकार',
        area: 'क्षेत्रफल (एकड़ में)',
        location: 'खेत का स्थान',
        detectLocation: 'मेरा स्थान पता लगाएं',
        locationDetected: 'स्थान मिल गया',
        saveFarm: 'खेत सेव करें',
        deleteFarm: 'खेत हटाएं',
        noFarms: 'अभी तक कोई खेत नहीं जोड़ा',
        addFirstFarm: 'अपना पहला खेत जोड़ें',
        acres: 'एकड़',
        crops: {
            paddy: 'धान',
            wheat: 'गेहूं',
            sugarcane: 'गन्ना',
            maize: 'मक्का',
            cotton: 'कपास',
            other: 'अन्य',
        },
    },
    en: {
        title: 'My Farms',
        addFarm: 'Add Farm',
        editFarm: 'Edit Farm',
        farmName: 'Farm Name',
        farmNamePlaceholder: 'e.g. North Field',
        cropType: 'Crop Type',
        area: 'Area (in acres)',
        location: 'Farm Location',
        detectLocation: 'Detect my location',
        locationDetected: 'Location detected',
        saveFarm: 'Save Farm',
        deleteFarm: 'Delete Farm',
        noFarms: 'No farms added yet',
        addFirstFarm: 'Add your first farm',
        acres: 'acres',
        crops: {
            paddy: 'Paddy',
            wheat: 'Wheat',
            sugarcane: 'Sugarcane',
            maize: 'Maize',
            cotton: 'Cotton',
            other: 'Other',
        },
    },
};

interface Farm {
    _id: string;
    name: string;
    cropType: string;
    areaInAcres: number;
    location?: {
        coordinates: [number, number];
    };
}

const cropIcons: Record<string, string> = {
    paddy: '🌾',
    wheat: '🌿',
    sugarcane: '🎋',
    maize: '🌽',
    cotton: '☁️',
    other: '🌱',
};

export default function FarmsPage() {
    const router = useRouter();
    const params = useParams();
    const locale = (params.locale as 'hi' | 'en') || 'hi';
    const text = t[locale];

    const [farms, setFarms] = useState<Farm[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

    // Form state
    const [farmName, setFarmName] = useState('');
    const [cropType, setCropType] = useState('paddy');
    const [area, setArea] = useState(5);
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadFarms();
    }, []);

    const loadFarms = async () => {
        try {
            const token = localStorage.getItem('token');
            const farmerData = localStorage.getItem('farmer');

            if (!token || !farmerData) {
                router.push(`/${locale}/login`);
                return;
            }

            const farmer = JSON.parse(farmerData);
            const res = await fetch(`/api/farms?farmerId=${farmer.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();
            if (data.success) {
                setFarms(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load farms:', error);
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) return;

        setDetectingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setDetectingLocation(false);
            },
            () => setDetectingLocation(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        if (!location) {
            detectLocation();
            return;
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('token');
            const url = editingFarm ? '/api/farms' : '/api/farms';
            const method = editingFarm ? 'PATCH' : 'POST';

            const body = editingFarm
                ? {
                    farmId: editingFarm._id,
                    name: farmName || (locale === 'hi' ? 'मेरा खेत' : 'My Farm'),
                    cropType,
                    areaInAcres: area,
                    location: {
                        coordinates: [location.lng, location.lat],
                    },
                }
                : {
                    name: farmName || (locale === 'hi' ? 'मेरा खेत' : 'My Farm'),
                    cropType,
                    areaInAcres: area,
                    location: {
                        coordinates: [location.lng, location.lat],
                    },
                };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                await loadFarms();
                resetForm();
            }
        } catch (error) {
            console.error('Failed to save farm:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (farmId: string) => {
        const confirmText = locale === 'hi'
            ? 'क्या आप वाकई इस खेत को हटाना चाहते हैं?'
            : 'Are you sure you want to delete this farm?';

        if (!confirm(confirmText)) return;

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/farms?farmId=${farmId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            await loadFarms();
        } catch (error) {
            console.error('Failed to delete farm:', error);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingFarm(null);
        setFarmName('');
        setCropType('paddy');
        setArea(5);
        setLocation(null);
    };

    const startEdit = (farm: Farm) => {
        setEditingFarm(farm);
        setFarmName(farm.name);
        setCropType(farm.cropType);
        setArea(farm.areaInAcres);
        if (farm.location?.coordinates) {
            setLocation({
                lng: farm.location.coordinates[0],
                lat: farm.location.coordinates[1],
            });
        }
        setShowForm(true);
    };

    const cropOptions = Object.entries(cropIcons).map(([type, icon]) => ({
        value: type,
        icon,
        label: text.crops[type as keyof typeof text.crops],
    }));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin text-4xl">🌾</div>
            </div>
        );
    }

    return (
        <div className="safe-area-top">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6 rounded-b-3xl">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-white">{text.title}</h1>
                    <button
                        onClick={() => setShowForm(true)}
                        className="
              w-10 h-10 rounded-full bg-white/20
              flex items-center justify-center
              text-white
            "
                    >
                        <FiPlus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 py-6">
                {farms.length === 0 ? (
                    <Card padding="lg" className="text-center">
                        <div className="text-6xl mb-4">🏞️</div>
                        <p className="text-gray-500 mb-6">{text.noFarms}</p>
                        <Button onClick={() => setShowForm(true)} icon={<FiPlus />}>
                            {text.addFirstFarm}
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {farms.map((farm) => (
                            <Card key={farm._id} padding="md">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-3xl">
                                        {cropIcons[farm.cropType] || '🌱'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-800">{farm.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {text.crops[farm.cropType as keyof typeof text.crops]} • {farm.areaInAcres} {text.acres}
                                        </p>
                                        {farm.location && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                <FiMapPin className="w-3 h-3" />
                                                {text.locationDetected}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEdit(farm)}
                                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                        >
                                            <FiEdit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(farm._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}

                        <Button
                            variant="outline"
                            onClick={() => setShowForm(true)}
                            icon={<FiPlus />}
                        >
                            {text.addFarm}
                        </Button>
                    </div>
                )}
            </div>

            {/* Add/Edit Farm Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                    <div className="w-full bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto safe-area-bottom">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                {editingFarm ? text.editFarm : text.addFarm}
                            </h2>
                            <button
                                onClick={resetForm}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-6 space-y-6">
                            {/* Farm Name */}
                            <Input
                                label={text.farmName}
                                placeholder={text.farmNamePlaceholder}
                                value={farmName}
                                onChange={(e) => setFarmName(e.target.value)}
                            />

                            {/* Crop Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    {text.cropType}
                                </label>
                                <IconSelector
                                    options={cropOptions}
                                    value={cropType}
                                    onChange={setCropType}
                                    columns={3}
                                />
                            </div>

                            {/* Area */}
                            <Slider
                                label={text.area}
                                min={0.5}
                                max={100}
                                step={0.5}
                                value={area}
                                onChange={setArea}
                                unit={text.acres}
                            />

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {text.location}
                                </label>
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    disabled={detectingLocation}
                                    className={`
                    w-full flex items-center justify-center gap-3
                    p-4 rounded-xl border-2 border-dashed
                    ${location
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-300 bg-white text-gray-600'
                                        }
                  `}
                                >
                                    {detectingLocation ? (
                                        <span className="animate-spin">⏳</span>
                                    ) : (
                                        <FiMapPin />
                                    )}
                                    <span className="font-medium">
                                        {detectingLocation
                                            ? (locale === 'hi' ? 'खोज रहे हैं...' : 'Detecting...')
                                            : location
                                                ? text.locationDetected + ' ✓'
                                                : text.detectLocation
                                        }
                                    </span>
                                </button>
                            </div>

                            {/* Submit */}
                            <Button
                                onClick={handleSubmit}
                                loading={saving}
                                icon="🌾"
                            >
                                {text.saveFarm}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
