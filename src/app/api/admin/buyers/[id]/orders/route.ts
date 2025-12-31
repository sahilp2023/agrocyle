import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Buyer from '@/lib/models/Buyer';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

// Ensure models
void Hub;
void Buyer;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/buyers/[id]/orders - List orders
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        await dbConnect();

        const query: Record<string, unknown> = { buyerId: id };
        if (status && status !== 'all') {
            query.status = status;
        }

        const orders = await BuyerOrder.find(query)
            .populate('hubId', 'name city')
            .sort({ createdAt: -1 });

        return successResponse(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        return errorResponse('Failed to fetch orders', 500);
    }
}

// POST /api/admin/buyers/[id]/orders - Create order
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();
        const { hubId, quantityTonnes, pricePerTonne, requestedDate, notes } = body;

        if (!hubId || !quantityTonnes || !pricePerTonne || !requestedDate) {
            return errorResponse('Hub, quantity, price, and requested date are required', 400);
        }

        await dbConnect();

        // Verify buyer exists
        const buyer = await Buyer.findById(id);
        if (!buyer) {
            return errorResponse('Buyer not found', 404);
        }

        const totalAmount = quantityTonnes * pricePerTonne;

        const order = await BuyerOrder.create({
            buyerId: id,
            hubId,
            quantityTonnes,
            pricePerTonne,
            totalAmount,
            requestedDate: new Date(requestedDate),
            status: 'pending',
            paymentStatus: 'pending',
            paidAmount: 0,
            notes,
        });

        return successResponse(order, 'Order created successfully');
    } catch (error) {
        console.error('Create order error:', error);
        return errorResponse('Failed to create order', 500);
    }
}

// PATCH /api/admin/buyers/[id]/orders - Update order (status, payment)
export async function PATCH(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { orderId, status, paymentStatus, paidAmount, invoiceNumber, dispatchedDate, deliveredDate } = body;

        if (!orderId) {
            return errorResponse('Order ID required', 400);
        }

        await dbConnect();

        const order = await BuyerOrder.findById(orderId);
        if (!order) {
            return errorResponse('Order not found', 404);
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (paidAmount !== undefined) order.paidAmount = paidAmount;
        if (invoiceNumber) order.invoiceNumber = invoiceNumber;
        if (dispatchedDate) order.dispatchedDate = new Date(dispatchedDate);
        if (deliveredDate) order.deliveredDate = new Date(deliveredDate);

        // Auto-update payment status
        if (order.paidAmount >= order.totalAmount) {
            order.paymentStatus = 'completed';
        } else if (order.paidAmount > 0) {
            order.paymentStatus = 'partial';
        }

        await order.save();

        return successResponse(order, 'Order updated');
    } catch (error) {
        console.error('Update order error:', error);
        return errorResponse('Failed to update order', 500);
    }
}
