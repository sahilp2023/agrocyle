import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import { createRazorpayOrder, getRazorpayKeyId } from '@/lib/razorpay';
import { successResponse, errorResponse } from '@/lib/utils';
import { getBuyerIdFromRequest } from '@/lib/utils/auth';

// POST /api/buyer/orders/[id]/pay - Create Razorpay order for payment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const buyerId = getBuyerIdFromRequest(request);
        if (!buyerId) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;

        await dbConnect();

        // Find the order
        const order = await BuyerOrder.findOne({ _id: id, buyerId });
        if (!order) {
            return errorResponse('Order not found', 404);
        }

        // Check if order is already paid
        if (order.paymentStatus === 'completed') {
            return errorResponse('Order is already paid', 400);
        }

        // Calculate pending amount
        const pendingAmount = order.totalAmount - order.paidAmount;
        if (pendingAmount <= 0) {
            return errorResponse('No pending amount to pay', 400);
        }

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder({
            amount: pendingAmount,
            receipt: `order_${order.orderNumber}`,
            notes: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                buyerId: buyerId,
            },
        });

        // Save Razorpay order ID to our order
        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return successResponse({
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: getRazorpayKeyId(),
            amount: pendingAmount,
            currency: 'INR',
            orderNumber: order.orderNumber,
            orderId: order._id,
        }, 'Razorpay order created');
    } catch (error) {
        console.error('Create payment order error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to create payment order',
            500
        );
    }
}
