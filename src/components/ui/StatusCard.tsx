import React from 'react';
import { FiCheck, FiClock, FiTruck, FiLoader, FiX } from 'react-icons/fi';

type Status = 'pending' | 'confirmed' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface StatusCardProps {
    status: Status;
    title: string;
    subtitle?: string;
    bookingId?: string;
    date?: string;
    amount?: string;
    estimatedAmount?: string;
    onClick?: () => void;
    onEdit?: () => void;
    onCancel?: () => void;
}

const statusConfig: Record<Status, { icon: React.ReactNode; color: string; bgColor: string; label?: string }> = {
    pending: {
        icon: <FiClock className="w-6 h-6" />,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50 border-amber-200',
    },
    confirmed: {
        icon: <FiCheck className="w-6 h-6" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
    },
    scheduled: {
        icon: <FiClock className="w-6 h-6" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 border-purple-200',
    },
    in_progress: {
        icon: <FiTruck className="w-6 h-6" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
    },
    completed: {
        icon: <FiCheck className="w-6 h-6" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
    },
    cancelled: {
        icon: <FiX className="w-6 h-6" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
    },
};

export default function StatusCard({
    status,
    title,
    subtitle,
    bookingId,
    date,
    amount,
    estimatedAmount,
    onClick,
    onEdit,
    onCancel,
}: StatusCardProps) {
    const config = statusConfig[status];
    const canEdit = ['pending', 'confirmed', 'scheduled'].includes(status);

    return (
        <div
            onClick={onClick}
            className={`
        w-full p-4 rounded-2xl border-2
        ${config.bgColor}
        text-left relative
        transition-all duration-200
        hover:shadow-lg
      `}
        >
            <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={`p-3 rounded-xl bg-white ${config.color}`}>
                    {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-gray-800 truncate">{title}</h3>
                        {bookingId && (
                            <span className="text-xs text-gray-500">#{bookingId.slice(-6).toUpperCase()}</span>
                        )}
                    </div>

                    {subtitle && (
                        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                    )}

                    {date && (
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {date}
                        </p>
                    )}

                    {/* Amount Display */}
                    {(amount || estimatedAmount) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            {amount ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Final Amount</span>
                                    <span className="text-lg font-bold text-green-600">{amount}</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Est. Amount</span>
                                    <span className="text-lg font-semibold text-gray-700">{estimatedAmount}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {canEdit && (onEdit || onCancel) && (
                        <div className="mt-3 flex gap-2 justify-end">
                            {onEdit && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                                    className="px-3 py-1 bg-white hover:bg-gray-50 text-gray-600 text-sm font-medium rounded-lg border border-gray-200 shadow-sm"
                                >
                                    Reschedule
                                </button>
                            )}
                            {onCancel && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                                    className="px-3 py-1 bg-white hover:bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 shadow-sm"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
