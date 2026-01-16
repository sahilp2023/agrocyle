import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
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

// GET /api/buyer/orders/[id] - Get single order
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;
        await dbConnect();
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        Hub;

        const order = await BuyerOrder.findOne({
            _id: id,
            buyerId: decoded.id
        }).populate('hubId', 'name city code');

        if (!order) {
            return errorResponse('Order not found', 404);
        }

        return successResponse({ order });
    } catch (error) {
        console.error('Get order error:', error);
        return errorResponse('Failed to fetch order', 500);
    }
}

// PUT /api/buyer/orders/[id] - Update order
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;
        const body = await request.json();

        await dbConnect();

        const order = await BuyerOrder.findOne({
            _id: id,
            buyerId: decoded.id
        });

        if (!order) {
            return errorResponse('Order not found', 404);
        }

        // Only allow updates if order is pending
        if (order.status !== 'pending') {
            return errorResponse('Cannot update order that is already processed', 400);
        }

        const { quantityTonnes, requestedDate, notes } = body;

        if (quantityTonnes) order.quantityTonnes = Number(quantityTonnes);
        if (requestedDate) order.requestedDate = new Date(requestedDate);
        if (notes !== undefined) order.notes = notes;

        // Recalculate total if quantity changed
        if (quantityTonnes) {
            order.totalAmount = order.quantityTonnes * order.pricePerTonne;
        }

        await order.save();

        return successResponse({ order }, 'Order updated successfully');
    } catch (error) {
        console.error('Update order error:', error);
        return errorResponse('Failed to update order', 500);
    }
}

// DELETE /api/buyer/orders/[id] - Cancel order
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;
        await dbConnect();

        const order = await BuyerOrder.findOne({
            _id: id,
            buyerId: decoded.id
        });

        if (!order) {
            return errorResponse('Order not found', 404);
        }

        // Only allow cancellation if order is pending
        if (order.status !== 'pending') {
            return errorResponse('Cannot cancel order that is already processed', 400);
        }

        order.status = 'cancelled';
        await order.save();

        return successResponse({ message: 'Order cancelled successfully' });
    } catch (error) {
        console.error('Cancel order error:', error);
        return errorResponse('Failed to cancel order', 500);
    }
}
