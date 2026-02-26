import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Buyer from '@/lib/models/Buyer';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure models are registered
void Buyer;
void Hub;

// GET /api/hub/orders — list orders for this hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) return errorResponse('Unauthorized', 401);

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const hubObjectId = new mongoose.Types.ObjectId(manager.hubId);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { hubId: hubObjectId };

        // Only show orders that admin has confirmed or beyond
        if (status && status !== 'all') {
            query.status = status;
        } else {
            query.status = { $in: ['confirmed', 'processing', 'dispatched', 'delivered'] };
        }

        console.log('[Hub Orders GET] hubId:', manager.hubId, 'query:', JSON.stringify(query));

        const orders = await BuyerOrder.find(query)
            .populate('buyerId', 'companyName companyCode contactPerson phone email')
            .populate('hubId', 'name city code')
            .sort({ createdAt: -1 })
            .lean();

        console.log('[Hub Orders GET] Found', orders.length, 'orders');

        // Summary stats for this hub
        const stats = await BuyerOrder.aggregate([
            { $match: { hubId: hubObjectId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
                    processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
                    dispatched: { $sum: { $cond: [{ $eq: ['$status', 'dispatched'] }, 1, 0] } },
                    delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                },
            },
        ]);

        return successResponse({
            orders,
            stats: stats[0] || { total: 0, confirmed: 0, processing: 0, dispatched: 0, delivered: 0 },
        });
    } catch (error) {
        console.error('Hub orders GET error:', error);
        return errorResponse('Failed to fetch orders', 500);
    }
}
