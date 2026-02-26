'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
    FiArrowLeft, FiUser, FiPhone, FiTruck, FiMapPin,
    FiActivity, FiClock, FiCheckCircle, FiStar
} from 'react-icons/fi';

const LocationMap = dynamic(() => import('@/components/LocationMap'), { ssr: false });

interface OperatorRecord {
    _id: string;
    name: string;
    phone: string;
    operatorType: 'baler' | 'truck' | 'both';
    vehicleNumber: string;
    vehicleModel?: string;
    licenseNumber?: string;
    isVerified: boolean;
    isOnline: boolean;
    totalJobs: number;
    totalEarnings: number;
    rating?: number;
    currentLocation?: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
    };
    createdAt: string;
}

interface RecordStats {
    totalAssignments: number;
    completedAssignments: number;
    activeAssignments: number;
    totalQuantityTonnes: number;
    totalTimeMinutes: number;
    avgMoisture: number;
}

interface RecentAssignment {
    _id: string;
    status: string;
    operatorStatus: string;
    assignedAt: string;
    completedAt?: string;
    actualQuantityTonnes?: number;
    timeRequired?: number;
    bookingId?: {
        cropType: string;
        estimatedStubbleTonnes: number;
        farmerId?: { name: string; village?: string };
    };
}

// Dummy vehicle data for MVP showcase
const dummyVehicleData = {
    odometer: 1949.64,
    currentSpeed: 0,
    topSpeed: 45,
    fuelEconomy: 3.2,
    runningTime: '284 hrs',
    idleTime: '42 hrs',
    lastServiceDate: '15 Jan 2026',
    nextServiceDue: '15 Apr 2026',
    engineHours: 1260,
    monthlyData: [
        { month: 'Sep', distance: 320, jobs: 8 },
        { month: 'Oct', distance: 480, jobs: 12 },
        { month: 'Nov', distance: 890, jobs: 22 },
        { month: 'Dec', distance: 1200, jobs: 28 },
        { month: 'Jan', distance: 950, jobs: 24 },
        { month: 'Feb', distance: 640, jobs: 16 },
    ],
};

export default function FleetRecordPage() {
    const { id } = useParams();
    const router = useRouter();
    const [operator, setOperator] = useState<OperatorRecord | null>(null);
    const [stats, setStats] = useState<RecordStats | null>(null);
    const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecord();
    }, [id]);

    const loadRecord = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('hubToken');
            const res = await fetch(`/api/hub/fleet/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setOperator(data.data.operator);
                setStats(data.data.stats);
                setRecentAssignments(data.data.recentAssignments || []);
            }
        } catch (error) {
            console.error('Failed to load record:', error);
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

    if (!operator) {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-500">Operator not found</p>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 font-medium">← Back</button>
            </div>
        );
    }

    const lat = operator.currentLocation?.coordinates?.[1];
    const lng = operator.currentLocation?.coordinates?.[0];
    const hasLocation = lat !== undefined && lng !== undefined && !(lat === 0 && lng === 0);
    const typeLabel = operator.operatorType === 'both' ? 'Baler & Truck'
        : operator.operatorType === 'truck' ? 'Truck Operator' : 'Baler Operator';
    const typeEmoji = operator.operatorType === 'truck' ? '🚛' : '🚜';
    const maxBar = Math.max(...dummyVehicleData.monthlyData.map(d => d.distance));

    return (
        <div className="space-y-6">
            {/* Header Bar */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => router.push('/hub/fleet')} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30">
                        <FiArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <p className="text-xs text-white/70 uppercase tracking-wider">
                            Communication Sync: {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-white/70">
                            Location Sync: {hasLocation ? new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Not Available'}
                        </p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${operator.isOnline ? 'bg-green-400/30 text-white' : 'bg-white/20 text-white/80'}`}>
                            {operator.isOnline ? '● Online' : '○ Offline'}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">Driver Info ↓</span>
                    </div>
                </div>
            </div>

            {/* Vehicle Info Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-4xl">
                        {typeEmoji}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{operator.vehicleNumber}</h2>
                        <p className="text-sm text-gray-500">{operator.vehicleModel || typeLabel}</p>
                        <p className="text-xs text-gray-400 mt-0.5">License: {operator.licenseNumber || 'N/A'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-700">{dummyVehicleData.odometer.toFixed(0)}</p>
                        <p className="text-xs text-blue-500 mt-1">Odometer (km)</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{dummyVehicleData.currentSpeed}</p>
                        <p className="text-xs text-green-500 mt-1">Current Speed</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-purple-700">{dummyVehicleData.topSpeed}</p>
                        <p className="text-xs text-purple-500 mt-1">Top Speed (km/h)</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-700">{dummyVehicleData.fuelEconomy}</p>
                        <p className="text-xs text-amber-500 mt-1">Fuel Economy (kmpl)</p>
                    </div>
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-teal-700">{dummyVehicleData.runningTime}</p>
                        <p className="text-xs text-teal-500 mt-1">Running Time</p>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-red-700">{dummyVehicleData.idleTime}</p>
                        <p className="text-xs text-red-500 mt-1">Idle Time</p>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Location Map */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                        <FiMapPin className="w-4 h-4 text-teal-500" />
                        <h3 className="font-semibold text-gray-800">Current Location</h3>
                        {hasLocation && (
                            <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Live</span>
                        )}
                    </div>
                    <div className="h-72">
                        {hasLocation ? (
                            <LocationMap lat={lat!} lng={lng!} label={operator.name} height="288px" />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <FiMapPin className="w-12 h-12 mb-3 opacity-30" />
                                <p className="text-sm">Location not available</p>
                                <p className="text-xs mt-1">Operator needs to go online for GPS tracking</p>
                            </div>
                        )}
                    </div>
                    {hasLocation && (
                        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                            📍 Lat: {lat?.toFixed(4)}, Lng: {lng?.toFixed(4)}
                        </div>
                    )}
                </div>

                {/* Driver Info */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                        <FiUser className="w-4 h-4 text-teal-500" />
                        <h3 className="font-semibold text-gray-800">Driver Information</h3>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-blue-100 rounded-xl flex items-center justify-center text-3xl">
                            {typeEmoji}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">{operator.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <FiPhone className="w-3.5 h-3.5" />
                                <span>+91 {operator.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{typeLabel}</span>
                                {operator.isVerified && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                        <FiCheckCircle className="w-3 h-3" /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-gray-800">{operator.totalJobs}</p>
                            <p className="text-xs text-gray-400">Total Jobs</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-green-600">₹{(operator.totalEarnings || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">Earnings</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-amber-600 flex items-center justify-center gap-1">
                                {operator.rating || '5.0'} <FiStar className="w-4 h-4" />
                            </p>
                            <p className="text-xs text-gray-400">Rating</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3 text-sm text-gray-600 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vehicle Number</span>
                            <span className="font-medium">{operator.vehicleNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Vehicle Model</span>
                            <span className="font-medium">{operator.vehicleModel || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">License</span>
                            <span className="font-medium">{operator.licenseNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Last Service</span>
                            <span className="font-medium">{dummyVehicleData.lastServiceDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Next Service Due</span>
                            <span className="font-medium text-amber-600">{dummyVehicleData.nextServiceDue}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Engine Hours</span>
                            <span className="font-medium">{dummyVehicleData.engineHours} hrs</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Joined</span>
                            <span className="font-medium">
                                {new Date(operator.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <FiActivity className="w-4 h-4 text-teal-500" />
                        <h3 className="font-semibold text-gray-800">Work Performance</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-teal-700">{stats?.totalAssignments || 0}</p>
                        <p className="text-xs text-teal-500 mt-1">Total Jobs</p>
                    </div>
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-green-700">{stats?.completedAssignments || 0}</p>
                        <p className="text-xs text-green-500 mt-1">Completed</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-blue-700">{(stats?.totalQuantityTonnes || 0).toFixed(1)}T</p>
                        <p className="text-xs text-blue-500 mt-1">Total Bailed</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-amber-700">
                            {stats?.totalTimeMinutes ? `${Math.round(stats.totalTimeMinutes / 60)}h` : '0h'}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">Total Time</p>
                    </div>
                </div>

                {/* Monthly Chart (visual bar chart with dummy data) */}
                <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Monthly Distance & Jobs</h4>
                    <div className="flex items-end gap-3 h-36">
                        {dummyVehicleData.monthlyData.map((m) => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] text-gray-400">{m.jobs}</span>
                                <div className="w-full bg-teal-100 rounded-t-md relative"
                                    style={{ height: `${(m.distance / maxBar) * 100}%`, minHeight: '8px' }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t-md" />
                                </div>
                                <span className="text-[10px] text-gray-500 font-medium">{m.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-4 mt-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-teal-500" /> Distance (km)
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="text-gray-600">Numbers</span> = Jobs completed
                        </span>
                    </div>
                </div>
            </div>

            {/* Recent Assignments Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-teal-500" />
                    <h3 className="font-semibold text-gray-800">Recent Work History</h3>
                </div>
                {recentAssignments.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No assignments yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                <tr>
                                    <th className="text-left px-5 py-3">Date</th>
                                    <th className="text-left px-5 py-3">Farmer</th>
                                    <th className="text-left px-5 py-3">Crop</th>
                                    <th className="text-left px-5 py-3">Qty (T)</th>
                                    <th className="text-left px-5 py-3">Time</th>
                                    <th className="text-left px-5 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {recentAssignments.map((a) => (
                                    <tr key={a._id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 text-gray-600">
                                            {new Date(a.assignedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short',
                                            })}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-gray-800">
                                            {a.bookingId?.farmerId?.name || '-'}
                                        </td>
                                        <td className="px-5 py-3 capitalize text-gray-600">
                                            {a.bookingId?.cropType || '-'}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-gray-800">
                                            {a.actualQuantityTonnes || a.bookingId?.estimatedStubbleTonnes || '-'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-600">
                                            {a.timeRequired ? `${a.timeRequired}m` : '-'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                a.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                    a.status === 'assigned' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-600'
                                                }`}>
                                                {a.status === 'completed' ? 'Completed' :
                                                    a.status === 'in_progress' ? 'In Progress' :
                                                        a.status === 'assigned' ? 'Assigned' : a.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
