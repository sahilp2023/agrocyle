'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    FiArrowLeft, FiCheck, FiX, FiUser, FiPhone, FiMapPin,
    FiClock, FiCamera, FiSend, FiPackage, FiNavigation
} from 'react-icons/fi';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

interface JobDetail {
    _id: string;
    operatorStatus: string;
    status: string;
    assignedAt: string;
    completedAt?: string;
    estimatedEarning?: number;
    actualQuantityTonnes?: number;
    baleCount?: number;
    loadWeightTonnes?: number;
    timeRequired?: number;
    moistureContent?: number;
    operatorRemarks?: string;
    photos?: { before: string[]; after: string[]; fieldCondition: string[] };
    bookingId?: {
        cropType: string;
        estimatedStubbleTonnes: number;
        scheduledPickupDate?: string;
        farmerNotes?: string;
        farmerId?: {
            name: string;
            phone: string;
            village?: string;
            city?: string;
            location?: {
                type: string;
                coordinates: [number, number]; // [lng, lat]
                address?: string;
            };
        };
        farmId?: {
            plotName: string;
            areaAcre: number;
            geometry?: {
                type: string;
                coordinates: number[][][];
            };
        };
    };
    hubId?: { name: string; city: string };
}

const statusSteps = [
    { key: 'pending', label: 'Pending', icon: '⏳' },
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'work_started', label: 'Work Started', icon: '🚜' },
    { key: 'work_complete', label: 'Completed', icon: '📋' },
];

export default function OperatorJobDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    // Completion form state
    const [showCompletionForm, setShowCompletionForm] = useState(false);
    const [timeRequired, setTimeRequired] = useState('');
    const [quantityBailed, setQuantityBailed] = useState('');
    const [moistureContent, setMoistureContent] = useState('');
    const [fieldPhoto, setFieldPhoto] = useState<string>('');
    const [remarks, setRemarks] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadJob();
    }, [id]);

    const loadJob = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('operatorToken');
            const res = await fetch('/api/operator/jobs?status=incoming', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            // Find from incoming first
            let found = data.data?.jobs?.find((j: JobDetail) => j._id === id);

            if (!found) {
                // Try active
                const res2 = await fetch('/api/operator/jobs?status=active', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data2 = await res2.json();
                found = data2.data?.jobs?.find((j: JobDetail) => j._id === id);
            }

            if (!found) {
                // Try history
                const res3 = await fetch('/api/operator/jobs', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data3 = await res3.json();
                found = data3.data?.jobs?.find((j: JobDetail) => j._id === id);
            }

            if (found) {
                setJob(found);
                // Pre-fill if data exists
                if (found.timeRequired) setTimeRequired(found.timeRequired.toString());
                if (found.actualQuantityTonnes) setQuantityBailed(found.actualQuantityTonnes.toString());
                if (found.moistureContent) setMoistureContent(found.moistureContent.toString());
            }
        } catch (err) {
            console.error('Failed to load job:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateJobStatus = async (newStatus: string) => {
        setUpdating(true);
        setError('');
        try {
            const token = localStorage.getItem('operatorToken');
            const res = await fetch('/api/operator/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ assignmentId: id, operatorStatus: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                await loadJob();
            } else {
                setError(data.error || data.message || 'Failed to update');
            }
        } catch {
            setError('Network error');
        } finally {
            setUpdating(false);
        }
    };

    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            setFieldPhoto(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitCompletion = async () => {
        if (!timeRequired || !quantityBailed) {
            setError('Time required and quantity bailed are mandatory');
            return;
        }

        setUpdating(true);
        setError('');
        try {
            const token = localStorage.getItem('operatorToken');

            // First save the form data
            const formRes = await fetch('/api/operator/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    assignmentId: id,
                    actualQuantityTonnes: parseFloat(quantityBailed),
                    baleCount: Math.ceil(parseFloat(quantityBailed)),
                    timeRequired: parseInt(timeRequired),
                    moistureContent: moistureContent ? parseFloat(moistureContent) : undefined,
                    operatorRemarks: remarks || undefined,
                    photos: fieldPhoto ? { fieldCondition: [fieldPhoto] } : undefined,
                }),
            });
            const formData = await formRes.json();
            if (!formData.success) {
                setError(formData.error || 'Failed to save form data');
                setUpdating(false);
                return;
            }

            // Then transition to work_complete
            const statusRes = await fetch('/api/operator/jobs', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ assignmentId: id, operatorStatus: 'work_complete' }),
            });
            const statusData = await statusRes.json();
            if (statusData.success) {
                setShowCompletionForm(false);
                await loadJob();
            } else {
                setError(statusData.error || statusData.message || 'Failed to mark complete');
            }
        } catch {
            setError('Network error');
        } finally {
            setUpdating(false);
        }
    };

    // Compute map coordinates — must be before conditional returns (hooks ordering rule)
    const mapCoords = useMemo(() => {
        if (!job) return null;
        const farmGeom = job.bookingId?.farmId?.geometry;
        if (farmGeom && farmGeom.coordinates && farmGeom.coordinates[0] && farmGeom.coordinates[0].length > 0) {
            const ring = farmGeom.coordinates[0];
            const sumLat = ring.reduce((s: number, p: number[]) => s + (p[1] || 0), 0);
            const sumLng = ring.reduce((s: number, p: number[]) => s + (p[0] || 0), 0);
            return { lat: sumLat / ring.length, lng: sumLng / ring.length };
        }
        const loc = job.bookingId?.farmerId?.location;
        if (loc?.coordinates && loc.coordinates[0] !== 0 && loc.coordinates[1] !== 0) {
            return { lat: loc.coordinates[1], lng: loc.coordinates[0] };
        }
        return null;
    }, [job]);

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-4xl">🚜</div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Job not found</p>
                <button onClick={() => router.back()} className="mt-4 text-orange-600 font-medium">← Back</button>
            </div>
        );
    }

    const farmer = job.bookingId?.farmerId;
    const farm = job.bookingId?.farmId;
    const currentStepIndex = statusSteps.findIndex(s => s.key === job.operatorStatus);
    const isPending = job.operatorStatus === 'pending';
    const isActive = ['accepted', 'en_route', 'arrived', 'work_started'].includes(job.operatorStatus);
    const isWorkComplete = job.operatorStatus === 'work_complete';
    const isCompleted = job.operatorStatus === 'delivered' || job.status === 'completed';

    return (
        <div className="p-4 space-y-4 pb-32">
            {/* Back button */}
            <button onClick={() => router.back()}
                className="flex items-center gap-1 text-gray-500 text-sm hover:text-gray-700">
                <FiArrowLeft className="w-4 h-4" /> Back to Jobs
            </button>

            {/* Job Header */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-white/70 text-xs uppercase tracking-wider">Assignment</p>
                        <h2 className="text-xl font-bold mt-0.5">AS-{job._id.slice(-4).toUpperCase()}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isPending ? 'bg-white/20' :
                        isActive ? 'bg-green-400/30' :
                            isWorkComplete ? 'bg-blue-400/30' :
                                'bg-white/30'
                        }`}>
                        {statusSteps.find(s => s.key === job.operatorStatus)?.label || job.operatorStatus}
                    </span>
                </div>
                <div className="flex gap-6 mt-3 text-sm text-white/80">
                    <span>🌾 {job.bookingId?.cropType}</span>
                    <span>📦 {job.bookingId?.estimatedStubbleTonnes}T est.</span>
                    {job.hubId && <span>🏢 {job.hubId.name}</span>}
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    {statusSteps.map((step, i) => (
                        <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${i <= currentStepIndex
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-400'
                                    }`}>
                                    {step.icon}
                                </div>
                                <span className={`text-[10px] mt-1 ${i <= currentStepIndex ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                                    {step.label}
                                </span>
                            </div>
                            {i < statusSteps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-orange-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Farmer Details Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Farmer Details</h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FiUser className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">{farmer?.name || 'N/A'}</p>
                            <p className="text-xs text-gray-400">{farmer?.village || farmer?.city || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiPhone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${farmer?.phone}`} className="text-blue-600 underline">
                            +91 {farmer?.phone || 'N/A'}
                        </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiMapPin className="w-4 h-4 text-gray-400" />
                        <span>{farm?.plotName || 'Farm Plot'} • {farm?.areaAcre || '-'} acres</span>
                    </div>
                    {job.bookingId?.scheduledPickupDate && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FiClock className="w-4 h-4 text-gray-400" />
                            <span>Scheduled: {new Date(job.bookingId.scheduledPickupDate).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}</span>
                        </div>
                    )}
                    {job.bookingId?.farmerNotes && (
                        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                            <span className="text-xs text-gray-400 uppercase">Farmer Notes:</span>
                            <p className="mt-0.5">{job.bookingId.farmerNotes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Farm Location Map — visible after accepting */}
            {!isPending && mapCoords && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                        <FiNavigation className="w-4 h-4 text-green-600" />
                        <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Farm Location</h3>
                    </div>
                    <div className="px-4 pb-2">
                        <p className="text-xs text-gray-400">
                            {farmer?.location?.address || `${farmer?.village || ''} ${farmer?.city || ''}`}
                            {' • '}{mapCoords.lat.toFixed(5)}, {mapCoords.lng.toFixed(5)}
                        </p>
                    </div>
                    <LocationMap
                        lat={mapCoords.lat}
                        lng={mapCoords.lng}
                        label={`${farmer?.name || 'Farmer'} — ${farm?.plotName || 'Farm'}`}
                        height="250px"
                    />
                    <div className="px-4 py-2 bg-green-50 border-t border-green-100 flex items-center gap-2">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${mapCoords.lat},${mapCoords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-700 font-medium hover:underline flex items-center gap-1"
                        >
                            <FiNavigation className="w-3.5 h-3.5" /> Open in Google Maps
                        </a>
                    </div>
                </div>
            )}

            {/* Job Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">Job Information</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-amber-600">Crop Type</p>
                        <p className="font-semibold text-amber-700 text-sm mt-0.5 capitalize">{job.bookingId?.cropType || '-'}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600">Est. Quantity</p>
                        <p className="font-semibold text-blue-700 text-sm mt-0.5">{job.bookingId?.estimatedStubbleTonnes || '-'}T</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-green-600">Assigned</p>
                        <p className="font-semibold text-green-700 text-sm mt-0.5">
                            {new Date(job.assignedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-purple-600">Farm Area</p>
                        <p className="font-semibold text-purple-700 text-sm mt-0.5">{farm?.areaAcre || '-'} acres</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">{error}</div>
            )}

            {/* Completion Form (when work_started) */}
            {(showCompletionForm || isWorkComplete || isCompleted) && !isPending && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
                        {isWorkComplete || isCompleted ? '📋 Submitted Report' : '📋 Completion Report'}
                    </h3>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Time Required (minutes) *</label>
                        <div className="relative">
                            <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input type="number" value={timeRequired}
                                onChange={(e) => setTimeRequired(e.target.value)}
                                disabled={isWorkComplete || isCompleted}
                                placeholder="e.g. 120"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 outline-none disabled:bg-gray-50" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Quantity Bailed (tonnes) *</label>
                        <div className="relative">
                            <FiPackage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input type="number" step="0.1" value={quantityBailed}
                                onChange={(e) => setQuantityBailed(e.target.value)}
                                disabled={isWorkComplete || isCompleted}
                                placeholder="e.g. 4.5"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 outline-none disabled:bg-gray-50" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Moisture Content (%)</label>
                        <input type="number" step="0.1" value={moistureContent}
                            onChange={(e) => setMoistureContent(e.target.value)}
                            disabled={isWorkComplete || isCompleted}
                            placeholder="e.g. 12.5"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 outline-none disabled:bg-gray-50" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Photo of Field</label>
                        {fieldPhoto ? (
                            <div className="relative">
                                <img src={fieldPhoto} alt="Field" className="w-full h-40 object-cover rounded-xl border border-gray-200" />
                                {!isWorkComplete && !isCompleted && (
                                    <button onClick={() => setFieldPhoto('')}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full">
                                        <FiX className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ) : job.photos?.fieldCondition?.[0] ? (
                            <img src={job.photos.fieldCondition[0]} alt="Field" className="w-full h-40 object-cover rounded-xl border" />
                        ) : !isWorkComplete && !isCompleted ? (
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 flex flex-col items-center gap-2 hover:border-orange-400 hover:text-orange-500 transition-colors">
                                <FiCamera className="w-6 h-6" />
                                <span className="text-sm">Tap to capture or upload photo</span>
                            </button>
                        ) : (
                            <p className="text-sm text-gray-400">No photo uploaded</p>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                            onChange={handlePhotoCapture} className="hidden" />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Remarks (optional)</label>
                        <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
                            disabled={isWorkComplete || isCompleted}
                            placeholder="Any observations about the field..."
                            rows={2}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:border-orange-500 outline-none resize-none disabled:bg-gray-50" />
                    </div>

                    {!isWorkComplete && !isCompleted && (
                        <button onClick={handleSubmitCompletion} disabled={updating || !timeRequired || !quantityBailed}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors">
                            {updating ? 'Submitting...' : (
                                <><FiSend className="w-4 h-4" /> Submit & Mark Complete</>
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-area-bottom z-40">
                {isPending && (
                    <div className="flex gap-3 max-w-lg mx-auto">
                        <button onClick={() => updateJobStatus('rejected')} disabled={updating}
                            className="flex-1 py-3 border-2 border-red-200 text-red-600 font-semibold rounded-xl flex items-center justify-center gap-1.5 hover:bg-red-50">
                            <FiX className="w-5 h-5" /> Reject
                        </button>
                        <button onClick={() => updateJobStatus('accepted')} disabled={updating}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50">
                            {updating ? '...' : <><FiCheck className="w-5 h-5" /> Accept Job</>}
                        </button>
                    </div>
                )}

                {job.operatorStatus === 'accepted' && (
                    <div className="max-w-lg mx-auto">
                        <button onClick={() => updateJobStatus('work_started')} disabled={updating}
                            className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50">
                            {updating ? '...' : <>🚜 Start Work</>}
                        </button>
                    </div>
                )}

                {job.operatorStatus === 'work_started' && !showCompletionForm && (
                    <div className="max-w-lg mx-auto">
                        <button onClick={() => setShowCompletionForm(true)}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-1.5">
                            📋 Fill Completion Report
                        </button>
                    </div>
                )}

                {(isWorkComplete) && (
                    <div className="max-w-lg mx-auto text-center">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-sm">
                            ⏳ Submitted for review — waiting for hub manager approval
                        </div>
                    </div>
                )}

                {isCompleted && (
                    <div className="max-w-lg mx-auto text-center">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm">
                            ✅ Job completed and approved
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
