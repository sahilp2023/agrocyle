import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

// Verify buyer token
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

// GET /api/buyer/orders - List buyer's orders
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        Hub;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { buyerId: decoded.id };
        if (status) {
            query.status = status;
        }

        const orders = await BuyerOrder.find(query)
            .populate('hubId', 'name city code')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await BuyerOrder.countDocuments(query);

        return successResponse({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        return errorResponse('Failed to fetch orders', 500);
    }
}

// POST /api/buyer/orders - Create new order
export async function POST(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            hubId,
            quantityTonnes,
            requestedDateStart,
            requestedDateEnd,
            pricePerTonne,
            notes
        } = body;

        if (!hubId || !quantityTonnes || !requestedDateStart) {
            return errorResponse('Hub, quantity and requested date are required', 400);
        }

        await dbConnect();

        // Verify hub exists
        const hub = await Hub.findById(hubId);
        if (!hub) {
            return errorResponse('Invalid hub selected', 400);
        }

        // Generate order number
        const year = new Date().getFullYear();
        const count = await BuyerOrder.countDocuments() + 1;
        const orderNumber = `ORD-${year}-${String(count).padStart(4, '0')}`;

        const order = new BuyerOrder({
            buyerId: decoded.id,
            hubId,
            orderNumber,
            quantityTonnes: Number(quantityTonnes),
            pricePerTonne: Number(pricePerTonne) || 0,
            totalAmount: Number(quantityTonnes) * (Number(pricePerTonne) || 0),
            status: 'pending',
            requestedDate: new Date(requestedDateStart),
            requestedDateEnd: requestedDateEnd ? new Date(requestedDateEnd) : undefined,
            notes,
        });

        await order.save();

        return successResponse({ order }, 'Order created successfully', 201);
    } catch (error) {
        console.error('Create order error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to create order: ${errorMessage}`, 500);
    }
}
