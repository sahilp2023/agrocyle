import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Buyer from '@/lib/models/Buyer';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

// Ensure models are registered
void Hub;
void Buyer;

// GET /api/admin/buyer-orders - Get all buyer orders for admin
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const buyerId = searchParams.get('buyerId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = {};
        if (status) {
            query.status = status;
        }
        if (buyerId) {
            query.buyerId = buyerId;
        }

        const orders = await BuyerOrder.find(query)
            .populate('buyerId', 'companyName companyCode contactPerson email phone')
            .populate('hubId', 'name city code')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await BuyerOrder.countDocuments(query);

        // Get summary stats
        const stats = await BuyerOrder.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    confirmedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    },
                    dispatchedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'dispatched'] }, 1, 0] }
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    totalQuantity: { $sum: '$quantityTonnes' },
                    totalRevenue: { $sum: '$totalAmount' },
                    pendingPayment: {
                        $sum: { $subtract: ['$totalAmount', '$paidAmount'] }
                    },
                },
            },
        ]);

        return successResponse({
            orders,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            summary: stats[0] || {
                totalOrders: 0,
                pendingOrders: 0,
                confirmedOrders: 0,
                dispatchedOrders: 0,
                deliveredOrders: 0,
                totalQuantity: 0,
                totalRevenue: 0,
                pendingPayment: 0,
            }
        });
    } catch (error) {
        console.error('Get buyer orders error:', error);
        return errorResponse('Failed to fetch orders', 500);
    }
}

// PUT /api/admin/buyer-orders - Update order status (bulk or single)
export async function PUT(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { orderId, status, notes } = body;

        if (!orderId || !status) {
            return errorResponse('Order ID and status are required', 400);
        }

        const validStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return errorResponse('Invalid status', 400);
        }

        await dbConnect();

        const updateData: { status: string; notes?: string; dispatchedDate?: Date; deliveredDate?: Date } = { status };
        if (notes) updateData.notes = notes;
        if (status === 'dispatched') updateData.dispatchedDate = new Date();
        if (status === 'delivered') updateData.deliveredDate = new Date();

        const order = await BuyerOrder.findByIdAndUpdate(
            orderId,
            { $set: updateData },
            { new: true }
        ).populate('buyerId', 'companyName companyCode')
            .populate('hubId', 'name city code');

        if (!order) {
            return errorResponse('Order not found', 404);
        }

        return successResponse({ order }, 'Order updated successfully');
    } catch (error) {
        console.error('Update order error:', error);
        return errorResponse('Failed to update order', 500);
    }
}
