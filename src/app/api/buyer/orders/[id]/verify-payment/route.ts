import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { successResponse, errorResponse } from '@/lib/utils';
import { getBuyerIdFromRequest } from '@/lib/utils/auth';

// POST /api/buyer/orders/[id]/verify-payment - Verify Razorpay payment
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
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return errorResponse('Missing payment verification data', 400);
        }

        await dbConnect();

        // Find the order
        const order = await BuyerOrder.findOne({ _id: id, buyerId });
        if (!order) {
            return errorResponse('Order not found', 404);
        }

        // Verify the order matches
        if (order.razorpayOrderId !== razorpay_order_id) {
            return errorResponse('Order ID mismatch', 400);
        }

        // Verify payment signature
        const isValid = verifyPaymentSignature({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        });

        if (!isValid) {
            return errorResponse('Payment verification failed', 400);
        }

        // Update order with payment details
        const pendingAmount = order.totalAmount - order.paidAmount;
        order.razorpayPaymentId = razorpay_payment_id;
        order.paidAmount = order.totalAmount; // Full payment
        order.paymentStatus = 'completed';

        // If order was pending, confirm it
        if (order.status === 'pending') {
            order.status = 'confirmed';
        }

        await order.save();

        return successResponse({
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: order.paymentStatus,
            paidAmount: order.paidAmount,
        }, 'Payment verified successfully');
    } catch (error) {
        console.error('Verify payment error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to verify payment',
            500
        );
    }
}
