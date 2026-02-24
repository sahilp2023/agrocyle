import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import Assignment from '@/lib/models/Assignment';
import Booking from '@/lib/models/Booking';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

void Farmer;
void Booking;

// GET /api/hub/fleet/[id] — get single operator details + stats for record view
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;
        await dbConnect();

        const operator = await Operator.findOne({ _id: id, hubId: manager.hubId })
            .select('-otp -otpExpiry')
            .lean();

        if (!operator) {
            return errorResponse('Operator not found', 404);
        }

        // Get assignment stats for this operator
        const totalAssignments = await Assignment.countDocuments({ operatorId: id });
        const completedAssignments = await Assignment.countDocuments({ operatorId: id, status: 'completed' });
        const activeAssignments = await Assignment.countDocuments({ operatorId: id, status: { $in: ['assigned', 'in_progress'] } });

        // Get recent assignments
        const recentAssignments = await Assignment.find({ operatorId: id })
            .populate({
                path: 'bookingId',
                select: 'cropType estimatedStubbleTonnes actualStubbleTonnes farmerId',
                populate: { path: 'farmerId', select: 'name village' },
            })
            .sort({ assignedAt: -1 })
            .limit(10)
            .lean();

        // Aggregate totals
        const aggregation = await Assignment.aggregate([
            { $match: { operatorId: operator._id, status: 'completed' } },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: '$actualQuantityTonnes' },
                    totalTime: { $sum: '$timeRequired' },
                    avgMoisture: { $avg: '$moistureContent' },
                }
            },
        ]);
        const agg = aggregation[0] || { totalQuantity: 0, totalTime: 0, avgMoisture: 0 };

        return successResponse({
            operator,
            stats: {
                totalAssignments,
                completedAssignments,
                activeAssignments,
                totalQuantityTonnes: agg.totalQuantity || 0,
                totalTimeMinutes: agg.totalTime || 0,
                avgMoisture: agg.avgMoisture || 0,
            },
            recentAssignments,
        });
    } catch (error) {
        console.error('Get operator record error:', error);
        return errorResponse('Failed to fetch operator record', 500);
    }
}
