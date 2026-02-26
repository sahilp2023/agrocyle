import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

void Hub;

function verifyBuyerToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch {
        return null;
    }
}

// GET /api/buyer/deliveries — buyer's dispatched/delivered orders with quality + shipment
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {
            buyerId: decoded.id,
            status: { $in: ['dispatched', 'delivered'] },
        };
        if (status && status !== 'all') query.status = status;

        const deliveries = await BuyerOrder.find(query)
            .populate('hubId', 'name city code')
            .select('orderNumber quantityTonnes totalAmount status dispatchedDate deliveredDate qualityReport shipmentDetails hubId')
            .sort({ dispatchedDate: -1 })
            .lean();

        return successResponse(deliveries);
    } catch (error) {
        console.error('Buyer deliveries error:', error);
        return errorResponse('Failed to fetch deliveries', 500);
    }
}
