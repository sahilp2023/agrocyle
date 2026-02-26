'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiClock, FiTruck, FiChevronRight, FiPackage } from 'react-icons/fi';

interface Stats {
    today: { assigned: number; completed: number };
    active: number;
    pending: number;
    earnings: { daily: number; weekly: number; monthly: number };
    performance: { totalCompleted: number; completionRate: number };
}

interface Job {
    _id: string;
    operatorStatus: string;
    assignedAt: string;
    estimatedEarning?: number;
    farmLocation?: { lat: number; lng: number; address?: string };
    bookingId?: {
        cropType: string;
        estimatedStubbleTonnes: number;
        farmerId?: { name: string; phone: string; village?: string };
        farmId?: { plotName: string; areaAcre: number };
    };
    hubId?: { name: string; city: string };
}

const statusLabels: Record<string, { label: string; emoji: string; color: string }> = {
    pending: { label: 'New Assignment', emoji: '📋', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Accepted', emoji: '✅', color: 'bg-green-100 text-green-700' },
    en_route: { label: 'En Route', emoji: '🚗', color: 'bg-amber-100 text-amber-700' },
    arrived: { label: 'Arrived', emoji: '📍', color: 'bg-purple-100 text-purple-700' },
    work_started: { label: 'Working', emoji: '⚙️', color: 'bg-orange-100 text-orange-700' },
    work_complete: { label: 'Work Done', emoji: '✔️', color: 'bg-teal-100 text-teal-700' },
    loading: { label: 'Loading', emoji: '📦', color: 'bg-indigo-100 text-indigo-700' },
    in_transit: { label: 'In Transit', emoji: '🚛', color: 'bg-cyan-100 text-cyan-700' },
};

export default function OperatorDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeJob, setActiveJob] = useState<Job | null>(null);
    const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationStatus, setLocationStatus] = useState<'pending' | 'requesting' | 'sent' | 'denied' | 'unavailable'>('pending');

    useEffect(() => {
        fetchData();
        sendLocation();
    }, []);

    const saveLocationToServer = async (lat: number, lng: number, source: string) => {
        try {
            const token = localStorage.getItem('operatorToken');
            if (!token) {
                console.warn('[Location] No operator token found');
                setLocationStatus('denied');
                return;
            }
            const payload = {
                isOnline: true,
                currentLocation: { lat, lng },
            };
            console.log(`[Location] Sending (${source}):`, lat.toFixed(4), lng.toFixed(4));
            const res = await fetch('/api/operator/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                console.log('[Location] ✅ Saved successfully via', source);
                setLocationStatus('sent');
            } else {
                console.error('[Location] Save failed:', data.error || data);
                setLocationStatus('denied');
            }
        } catch (e) {
            console.error('[Location] Send error:', e);
            setLocationStatus('denied');
        }
    };

    const sendLocation = async () => {
        console.log('[Location] Starting location capture...');
        if (!navigator.geolocation) {
            console.warn('[Location] Geolocation API not available, falling back to IP');
            await ipFallback();
            return;
        }
        setLocationStatus('requesting');

        // Step 1: Try high-accuracy GPS
        navigator.geolocation.getCurrentPosition(
            (pos) => saveLocationToServer(pos.coords.latitude, pos.coords.longitude, 'GPS (high accuracy)'),
            (err) => {
                console.warn('[Location] High accuracy failed:', err.code, err.message);
                // Step 2: Retry with low accuracy (works better on desktops)
                navigator.geolocation.getCurrentPosition(
                    (pos) => saveLocationToServer(pos.coords.latitude, pos.coords.longitude, 'GPS (low accuracy)'),
                    async (err2) => {
                        console.warn('[Location] Low accuracy also failed:', err2.code, err2.message);
                        // Step 3: Fall back to IP-based geolocation
                        await ipFallback();
                    },
                    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
                );
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    const ipFallback = async () => {
        try {
            console.log('[Location] Trying IP-based geolocation...');
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            if (data.latitude && data.longitude) {
                console.log('[Location] Got IP location:', data.latitude, data.longitude, data.city);
                await saveLocationToServer(data.latitude, data.longitude, `IP (${data.city || 'unknown'})`);
            } else {
                console.error('[Location] IP geolocation returned no coords:', data);
                setLocationStatus('denied');
            }
        } catch (e) {
            console.error('[Location] IP fallback failed:', e);
            setLocationStatus('denied');
        }
    };

    const fetchData = async () => {
        const token = localStorage.getItem('operatorToken');
        if (!token) return;

        try {
            const [statsRes, activeRes, pendingRes] = await Promise.all([
                fetch('/api/operator/stats', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/operator/jobs?status=active&limit=1', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/operator/jobs?status=incoming&limit=5', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const [statsData, activeData, pendingData] = await Promise.all([
                statsRes.json(), activeRes.json(), pendingRes.json(),
            ]);

            if (statsData.success) setStats(statsData.data);
            if (activeData.success && activeData.data?.jobs?.length > 0) setActiveJob(activeData.data.jobs[0]);
            if (pendingData.success) setPendingJobs(pendingData.data?.jobs || []);
        } catch (error) {
            console.error('Dashboard fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin text-4xl">🚜</div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Location Status Banner */}
            {locationStatus === 'requesting' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3 animate-pulse">
                    <span className="text-xl">📍</span>
                    <div>
                        <p className="text-sm font-medium text-blue-800">Detecting your location...</p>
                        <p className="text-xs text-blue-600">Please allow location access if prompted</p>
                    </div>
                </div>
            )}
            {locationStatus === 'sent' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <div>
                        <p className="text-sm font-medium text-green-800">Location shared with hub</p>
                        <p className="text-xs text-green-600">Your position is visible to hub manager</p>
                    </div>
                </div>
            )}
            {(locationStatus === 'denied' || locationStatus === 'unavailable') && (
                <button onClick={sendLocation}
                    className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-left hover:bg-amber-100 transition-colors">
                    <span className="text-xl">📍</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">Location not shared</p>
                        <p className="text-xs text-amber-600">
                            {locationStatus === 'unavailable'
                                ? 'GPS not available on this device'
                                : 'Tap here to share your location with the hub'}
                        </p>
                    </div>
                    {locationStatus === 'denied' && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-lg font-medium">Enable GPS</span>
                    )}
                </button>
            )}
            {activeJob && (
                <button onClick={() => router.push(`/operator/jobs/${activeJob._id}`)}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-orange-500/20 text-left">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full">
                            {statusLabels[activeJob.operatorStatus]?.emoji} {statusLabels[activeJob.operatorStatus]?.label || 'Active'}
                        </span>
                        <FiChevronRight className="w-5 h-5 text-white/70" />
                    </div>
                    <h3 className="font-bold text-lg">{activeJob.bookingId?.farmerId?.name || 'Farmer'}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                        <span className="flex items-center gap-1"><FiMapPin className="w-3.5 h-3.5" /> {activeJob.bookingId?.farmerId?.village || 'Location'}</span>
                        <span className="flex items-center gap-1"><FiPackage className="w-3.5 h-3.5" /> {activeJob.bookingId?.estimatedStubbleTonnes || 0}T</span>
                    </div>
                    {activeJob.estimatedEarning && (
                        <p className="mt-2 text-sm font-semibold">₹{activeJob.estimatedEarning.toLocaleString()}</p>
                    )}
                </button>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Today&apos;s Jobs</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.today.assigned || 0}</p>
                    <p className="text-xs text-green-600 mt-1">{stats?.today.completed || 0} completed</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider">Today&apos;s Earnings</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₹{(stats?.earnings.daily || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">This week: ₹{(stats?.earnings.weekly || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-blue-500" />
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Pending</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.pending || 0}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                        <FiTruck className="w-4 h-4 text-orange-500" />
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Completion</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{stats?.performance.completionRate || 100}%</p>
                </div>
            </div>

            {/* Incoming Assignments */}
            {pendingJobs.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-800">📋 New Assignments</h2>
                        <button onClick={() => router.push('/operator/jobs')} className="text-sm text-orange-600 font-medium">View all</button>
                    </div>
                    <div className="space-y-3">
                        {pendingJobs.map(job => (
                            <button key={job._id} onClick={() => router.push(`/operator/jobs/${job._id}`)}
                                className="w-full bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-orange-300 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {job.bookingId?.farmerId?.name || 'Farmer'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                                            <FiMapPin className="w-3 h-3" /> {job.bookingId?.farmerId?.village || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-orange-600">
                                            {job.bookingId?.estimatedStubbleTonnes || 0}T
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {job.bookingId?.cropType || 'Crop'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!activeJob && pendingJobs.length === 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                    <span className="text-5xl">🌾</span>
                    <h3 className="text-lg font-semibold text-gray-800 mt-4">No active jobs</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        When a hub manager assigns you a job, it will appear here.
                        Make sure you&apos;re online to receive assignments!
                    </p>
                </div>
            )}

            {/* Monthly Earnings Summary */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-5 text-white">
                <p className="text-sm text-gray-400">This Month</p>
                <p className="text-3xl font-bold mt-1">₹{(stats?.earnings.monthly || 0).toLocaleString()}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <span>{stats?.performance.totalCompleted || 0} jobs completed</span>
                    <span>•</span>
                    <span>{stats?.performance.completionRate || 100}% rate</span>
                </div>
            </div>
        </div>
    );
}
