import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Hub from '@/lib/models/Hub';
import HubManager from '@/lib/models/HubManager';
import HubStaff from '@/lib/models/HubStaff';
import Baler from '@/lib/models/Baler';
import InventoryLog from '@/lib/models/InventoryLog';
import Booking from '@/lib/models/Booking';
import Payout from '@/lib/models/Payout';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import mongoose from 'mongoose';

// Ensure models are registered
void HubManager;
void HubStaff;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/hubs/[id] - Get full hub details with analytics
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        // Get hub
        const hub = await Hub.findById(id).lean();
        if (!hub) {
            return errorResponse('Hub not found', 404);
        }

        // Get hub manager
        const manager = await HubManager.findOne({ hubId: id, isActive: true })
            .select('name email phone lastLogin createdAt')
            .lean();

        // Get staff
        const staff = await HubStaff.find({ hubId: id, isActive: true })
            .select('name phone role createdAt')
            .lean();

        // Get fleet (balers and trucks)
        const fleet = await Baler.find({ hubId: id, isActive: true }).lean();
        const fleetStats = {
            balers: fleet.filter((v: { vehicleType?: string }) => v.vehicleType !== 'truck').length,
            trucks: fleet.filter((v: { vehicleType?: string }) => v.vehicleType === 'truck').length,
            available: fleet.filter((v: { status?: string }) => v.status === 'available').length,
            busy: fleet.filter((v: { status?: string }) => v.status === 'busy').length,
        };

        // Get inventory stats (this month)
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const inventoryStats = await InventoryLog.aggregate([
            {
                $match: {
                    hubId: new mongoose.Types.ObjectId(id),
                    createdAt: { $gte: startOfMonth },
                },
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$quantityTonnes' },
                },
            },
        ]);

        let inboundThisMonth = 0;
        let outboundThisMonth = 0;
        inventoryStats.forEach((stat: { _id: string; total: number }) => {
            if (stat._id === 'inbound') inboundThisMonth = stat.total;
            else if (stat._id === 'outbound') outboundThisMonth = stat.total;
        });

        // Get total inventory
        const totalInventory = await InventoryLog.aggregate([
            { $match: { hubId: new mongoose.Types.ObjectId(id) } },
            { $group: { _id: '$type', total: { $sum: '$quantityTonnes' } } },
        ]);
        let currentStock = 0;
        totalInventory.forEach((stat: { _id: string; total: number }) => {
            if (stat._id === 'inbound') currentStock += stat.total;
            else if (stat._id === 'outbound') currentStock -= stat.total;
        });

        // Get revenue this month
        const revenueStats = await Payout.aggregate([
            {
                $match: {
                    hubId: new mongoose.Types.ObjectId(id),
                    status: 'completed',
                    createdAt: { $gte: startOfMonth },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const revenueThisMonth = revenueStats[0]?.total || 0;

        // Get total revenue
        const totalRevenueStats = await Payout.aggregate([
            { $match: { hubId: new mongoose.Types.ObjectId(id), status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);
        const totalRevenue = totalRevenueStats[0]?.total || 0;

        // Get linked farmers count (unique farmers with completed pickups)
        const linkedFarmers = await Booking.distinct('farmerId', {
            hubId: new mongoose.Types.ObjectId(id),
            status: 'completed',
        });

        // Get total pickups
        const totalPickups = await Booking.countDocuments({
            hubId: new mongoose.Types.ObjectId(id),
            status: 'completed',
        });

        return successResponse({
            hub,
            manager,
            staff,
            fleetStats,
            analytics: {
                inboundThisMonth,
                outboundThisMonth,
                netChange: inboundThisMonth - outboundThisMonth,
                currentStock: Math.max(0, currentStock),
                revenueThisMonth,
                totalRevenue,
                linkedFarmersCount: linkedFarmers.length,
                totalPickups,
            },
        });
    } catch (error) {
        console.error('Get hub details error:', error);
        return errorResponse('Failed to fetch hub details', 500);
    }
}

// PATCH /api/admin/hubs/[id] - Update hub info
export async function PATCH(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();

        await dbConnect();

        const hub = await Hub.findById(id);
        if (!hub) {
            return errorResponse('Hub not found', 404);
        }

        // Update allowed fields
        const { name, city, state, address, contactPhone, servicePincodes, capacity, isActive } = body;
        if (name) hub.name = name;
        if (city) hub.city = city;
        if (state) hub.state = state;
        if (address !== undefined) hub.address = address;
        if (contactPhone !== undefined) hub.contactPhone = contactPhone;
        if (servicePincodes) hub.servicePincodes = servicePincodes;
        if (capacity) hub.capacity = capacity;
        if (isActive !== undefined) hub.isActive = isActive;

        await hub.save();

        return successResponse(hub, 'Hub updated successfully');
    } catch (error) {
        console.error('Update hub error:', error);
        return errorResponse('Failed to update hub', 500);
    }
}

// DELETE /api/admin/hubs/[id] - Deactivate hub
export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const hub = await Hub.findById(id);
        if (!hub) {
            return errorResponse('Hub not found', 404);
        }

        hub.isActive = false;
        await hub.save();

        // Also deactivate manager
        await HubManager.updateMany({ hubId: id }, { isActive: false });

        return successResponse({ message: 'Hub deactivated' });
    } catch (error) {
        console.error('Delete hub error:', error);
        return errorResponse('Failed to deactivate hub', 500);
    }
}
