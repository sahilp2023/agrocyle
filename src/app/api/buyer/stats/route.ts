import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import BuyerDelivery from '@/lib/models/BuyerDelivery';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

function verifyBuyerToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch {
        return null;
    }
}

// GET /api/buyer/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const buyerId = decoded.id;

        // Total ordered (sum of all order quantities)
        const orderedResult = await BuyerOrder.aggregate([
            { $match: { buyerId: { $eq: require('mongoose').Types.ObjectId.createFromHexString(buyerId) }, status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$quantityTonnes' } } }
        ]);
        const totalOrdered = orderedResult[0]?.total || 0;

        // Total received (sum of accepted delivery quantities)
        const receivedResult = await BuyerDelivery.aggregate([
            { $match: { buyerId: { $eq: require('mongoose').Types.ObjectId.createFromHexString(buyerId) }, status: 'accepted' } },
            { $group: { _id: null, total: { $sum: '$quantityTonnes' } } }
        ]);
        const totalReceived = receivedResult[0]?.total || 0;

        // Pending deliveries count
        const pendingDeliveries = await BuyerDelivery.countDocuments({
            buyerId,
            status: { $in: ['in_transit', 'delivered'] }
        });

        // Accepted vs rejected count
        const acceptedCount = await BuyerDelivery.countDocuments({
            buyerId,
            status: 'accepted'
        });

        const rejectedCount = await BuyerDelivery.countDocuments({
            buyerId,
            status: 'rejected'
        });

        // Order status breakdown
        const ordersByStatus = await BuyerOrder.aggregate([
            { $match: { buyerId: { $eq: require('mongoose').Types.ObjectId.createFromHexString(buyerId) } } },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const orderStatusCounts = ordersByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>);

        // Recent orders
        const recentOrders = await BuyerOrder.find({ buyerId })
            .populate('hubId', 'name city')
            .sort({ createdAt: -1 })
            .limit(5);

        return successResponse({
            stats: {
                totalOrdered,
                totalReceived,
                pendingDeliveries,
                acceptedCount,
                rejectedCount,
                ordersByStatus: orderStatusCounts,
            },
            recentOrders
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return errorResponse('Failed to fetch statistics', 500);
    }
}
