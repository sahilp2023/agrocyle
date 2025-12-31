import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Hub from '@/lib/models/Hub';
import Farmer from '@/lib/models/Farmer';
import Booking from '@/lib/models/Booking';
import Payout from '@/lib/models/Payout';
import InventoryLog from '@/lib/models/InventoryLog';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import mongoose from 'mongoose';

// Ensure models are registered
void Farmer;

// GET /api/admin/analytics - Get platform analytics
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        // Total pickups
        const totalPickups = await Booking.countDocuments({ status: 'completed' });

        // Total farmers
        const totalFarmers = await Farmer.countDocuments();

        // Total revenue
        const revenueStats = await Payout.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRevenue = revenueStats[0]?.total || 0;

        // Total inventory
        const inventoryStats = await InventoryLog.aggregate([
            { $group: { _id: '$type', total: { $sum: '$quantityTonnes' } } },
        ]);
        let totalStock = 0;
        inventoryStats.forEach((stat: { _id: string; total: number }) => {
            if (stat._id === 'inbound') totalStock += stat.total;
            else if (stat._id === 'outbound') totalStock -= stat.total;
        });

        // Monthly pickups (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyStats = await Booking.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyPickups = monthlyStats.map((m: { _id: number; count: number }) => ({
            month: monthNames[m._id - 1],
            count: m.count,
        }));

        // Hub utilization
        const hubs = await Hub.find({ isActive: true }).select('name').lean();
        const hubInventory = await InventoryLog.aggregate([
            { $group: { _id: { hubId: '$hubId', type: '$type' }, total: { $sum: '$quantityTonnes' } } },
        ]);

        const hubStocks: Record<string, number> = {};
        hubInventory.forEach((stat: { _id: { hubId: mongoose.Types.ObjectId; type: string }; total: number }) => {
            const hubId = stat._id.hubId.toString();
            if (!hubStocks[hubId]) hubStocks[hubId] = 0;
            if (stat._id.type === 'inbound') hubStocks[hubId] += stat.total;
            else hubStocks[hubId] -= stat.total;
        });

        const hubUtilization = hubs.map((hub: { _id: mongoose.Types.ObjectId; name: string }) => ({
            hub: hub.name,
            percent: Math.min(100, Math.round(((hubStocks[hub._id.toString()] || 0) / 500) * 100)),
        }));

        // Average pickup value
        const avgPickupValue = totalPickups > 0 ? totalRevenue / totalPickups : 0;

        return successResponse({
            totalPickups,
            totalFarmers,
            totalRevenue,
            totalStock: Math.max(0, totalStock),
            monthlyPickups,
            hubUtilization,
            avgPickupValue,
        });
    } catch (error) {
        console.error('Get admin analytics error:', error);
        return errorResponse('Failed to fetch analytics', 500);
    }
}
