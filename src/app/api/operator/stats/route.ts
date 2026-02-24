import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Assignment from '@/lib/models/Assignment';
import { successResponse, errorResponse } from '@/lib/utils';
import { getOperatorFromRequest } from '@/lib/utils/operatorAuth';

// GET /api/operator/stats - Get operator dashboard stats
export async function GET(request: NextRequest) {
    try {
        const operator = getOperatorFromRequest(request);
        if (!operator) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // Today's jobs
        const todayJobs = await Assignment.countDocuments({
            operatorId: operator.id,
            assignedAt: { $gte: todayStart },
        });

        const todayCompleted = await Assignment.countDocuments({
            operatorId: operator.id,
            completedAt: { $gte: todayStart },
            status: 'completed',
        });

        // Active jobs right now
        const activeJobs = await Assignment.countDocuments({
            operatorId: operator.id,
            operatorStatus: { $in: ['accepted', 'en_route', 'arrived', 'work_started', 'work_complete', 'loading', 'in_transit'] },
        });

        // Incoming/pending jobs
        const pendingJobs = await Assignment.countDocuments({
            operatorId: operator.id,
            operatorStatus: 'pending',
        });

        // Earnings calculations
        const earningsAgg = await Assignment.aggregate([
            { $match: { operatorId: { $exists: true }, status: 'completed' } },
            {
                $facet: {
                    daily: [
                        { $match: { completedAt: { $gte: todayStart } } },
                        { $group: { _id: null, total: { $sum: '$estimatedEarning' }, count: { $sum: 1 } } },
                    ],
                    weekly: [
                        { $match: { completedAt: { $gte: weekStart } } },
                        { $group: { _id: null, total: { $sum: '$estimatedEarning' }, count: { $sum: 1 } } },
                    ],
                    monthly: [
                        { $match: { completedAt: { $gte: monthStart } } },
                        { $group: { _id: null, total: { $sum: '$estimatedEarning' }, count: { $sum: 1 } } },
                    ],
                    allTime: [
                        { $group: { _id: null, total: { $sum: '$estimatedEarning' }, count: { $sum: 1 } } },
                    ],
                },
            },
        ]);

        const earnings = earningsAgg[0] || {};

        // Total stats
        const totalCompleted = await Assignment.countDocuments({
            operatorId: operator.id,
            status: 'completed',
        });

        const totalCancelled = await Assignment.countDocuments({
            operatorId: operator.id,
            operatorStatus: 'rejected',
        });

        return successResponse({
            today: {
                assigned: todayJobs,
                completed: todayCompleted,
            },
            active: activeJobs,
            pending: pendingJobs,
            earnings: {
                daily: earnings.daily?.[0]?.total || 0,
                weekly: earnings.weekly?.[0]?.total || 0,
                monthly: earnings.monthly?.[0]?.total || 0,
                allTime: earnings.allTime?.[0]?.total || 0,
            },
            performance: {
                totalCompleted,
                totalCancelled,
                completionRate: totalCompleted + totalCancelled > 0
                    ? Math.round((totalCompleted / (totalCompleted + totalCancelled)) * 100)
                    : 100,
            },
        });
    } catch (error) {
        console.error('Get operator stats error:', error);
        return errorResponse('Failed to fetch stats', 500);
    }
}
