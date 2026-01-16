import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import BuyerDelivery from '@/lib/models/BuyerDelivery';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Hub from '@/lib/models/Hub';
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

// GET /api/buyer/deliveries - List buyer's deliveries
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        Hub;
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        BuyerOrder;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const orderId = searchParams.get('orderId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { buyerId: decoded.id };
        if (status) {
            query.status = status;
        }
        if (orderId) {
            query.orderId = orderId;
        }

        const deliveries = await BuyerDelivery.find(query)
            .populate('hubId', 'name city code')
            .populate('orderId', 'orderNumber quantityTonnes')
            .sort({ deliveryDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await BuyerDelivery.countDocuments(query);

        return successResponse({
            deliveries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get deliveries error:', error);
        return errorResponse('Failed to fetch deliveries', 500);
    }
}
