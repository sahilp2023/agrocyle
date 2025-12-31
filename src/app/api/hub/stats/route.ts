import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Booking from '@/lib/models/Booking';
import Assignment from '@/lib/models/Assignment';
import InventoryLog from '@/lib/models/InventoryLog';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure Farmer model is registered for populate
void Farmer;

// GET /api/hub/stats - Get dashboard stats for a hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const hubId = manager.hubId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count pending requests
        const pendingRequests = await Booking.countDocuments({
            hubId,
            status: 'pending',
        });

        // Count active assignments (assigned or in_progress)
        const activeAssignments = await Assignment.countDocuments({
            hubId,
            status: { $in: ['assigned', 'in_progress'] },
        });

        // Count completed today
        const completedToday = await Assignment.countDocuments({
            hubId,
            status: 'completed',
            completedAt: { $gte: today },
        });

        // Calculate total inventory (inbound - outbound)
        const inventoryStats = await InventoryLog.aggregate([
            { $match: { hubId: manager.hubId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$quantityTonnes' },
                },
            },
        ]);

        let totalInventory = 0;
        inventoryStats.forEach((stat: { _id: string; total: number }) => {
            if (stat._id === 'inbound') {
                totalInventory += stat.total;
            } else if (stat._id === 'outbound') {
                totalInventory -= stat.total;
            }
        });

        // Get recent activity (last 5 items)
        const recentAssignments = await Assignment.find({ hubId })
            .populate({
                path: 'bookingId',
                select: 'cropType',
                populate: {
                    path: 'farmerId',
                    select: 'name',
                },
            })
            .populate('balerId', 'vehicleNumber operatorName')
            .sort({ updatedAt: -1 })
            .limit(5);

        const recentActivity = recentAssignments.map((a) => ({
            id: a._id,
            type: a.status === 'completed' ? 'completion' : 'assignment',
            message:
                a.status === 'completed'
                    ? `Pickup completed for ${a.bookingId?.farmerId?.name || 'farmer'}`
                    : `Baler ${a.balerId?.vehicleNumber || ''} assigned`,
            timestamp: a.updatedAt,
        }));

        return successResponse({
            pendingRequests,
            activeAssignments,
            completedToday,
            totalInventory: Math.max(0, totalInventory),
            recentActivity,
        });
    } catch (error) {
        console.error('Get hub stats error:', error);
        return errorResponse('Failed to fetch stats', 500);
    }
}
