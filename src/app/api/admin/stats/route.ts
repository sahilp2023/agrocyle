import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Hub from '@/lib/models/Hub';
import Farmer from '@/lib/models/Farmer';
import Booking from '@/lib/models/Booking';
import InventoryLog from '@/lib/models/InventoryLog';
import SupportTicket from '@/lib/models/SupportTicket';
import Payout from '@/lib/models/Payout';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

// Ensure models are registered
void Farmer;

// GET /api/admin/stats - Get admin dashboard stats
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        // Get hub counts
        const totalHubs = await Hub.countDocuments();
        const activeHubs = await Hub.countDocuments({ isActive: true });

        // Get farmer count
        const totalFarmers = await Farmer.countDocuments();

        // Get completed pickups
        const totalPickups = await Booking.countDocuments({ status: 'completed' });

        // Get total inventory
        const inventoryStats = await InventoryLog.aggregate([
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

        // Get open support tickets
        const openTickets = await SupportTicket.countDocuments({
            status: { $in: ['open', 'in_progress'] },
        });

        // Get total revenue (from payouts)
        const revenueStats = await Payout.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRevenue = revenueStats[0]?.total || 0;

        return successResponse({
            totalHubs,
            activeHubs,
            totalFarmers,
            totalPickups,
            totalInventory: Math.max(0, totalInventory),
            openTickets,
            totalRevenue,
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        return errorResponse('Failed to fetch stats', 500);
    }
}
