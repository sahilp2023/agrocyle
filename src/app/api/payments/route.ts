import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Payment from '@/lib/models/Payment';
import Booking from '@/lib/models/Booking';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getFarmerIdFromRequest } from '@/lib/utils/auth';

// GET /api/payments - List payments
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const farmerId = searchParams.get('farmerId');
        const status = searchParams.get('status');
        const { page, limit, skip } = getPaginationParams(searchParams);

        const query: Record<string, unknown> = {};

        if (farmerId) {
            query.farmerId = farmerId;
        }

        if (status) {
            query.status = status;
        }

        const total = await Payment.countDocuments(query);
        const payments = await Payment.find(query)
            .populate({
                path: 'bookingId',
                select: 'estimatedStubbleTonnes actualStubbleTonnes estimatedPrice finalPrice status',
                populate: {
                    path: 'farmId',
                    select: 'name cropType',
                },
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return successResponse(
            payments,
            undefined,
            createPaginationMeta(total, page, limit)
        );
    } catch (error) {
        console.error('Get payments error:', error);
        return errorResponse('Failed to fetch payments', 500);
    }
}

// POST /api/payments - Create payment record (usually after booking completion)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { bookingId, paymentMethod = 'upi' } = body;

        if (!bookingId) {
            return errorResponse('Booking ID is required', 400);
        }

        await dbConnect();

        // Get booking to determine amount
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return errorResponse('Booking not found', 404);
        }

        if (booking.status !== 'completed') {
            return errorResponse('Payment can only be created for completed bookings', 400);
        }

        // Check if payment already exists
        const existingPayment = await Payment.findOne({ bookingId });
        if (existingPayment) {
            return errorResponse('Payment already exists for this booking', 400);
        }

        // Use final price if available, otherwise estimated
        const amount = booking.finalPrice || booking.estimatedPrice;

        const payment = await Payment.create({
            bookingId,
            farmerId: booking.farmerId,
            amount,
            status: 'pending',
            paymentMethod,
        });

        return successResponse(payment, 'Payment record created');
    } catch (error) {
        console.error('Create payment error:', error);
        return errorResponse('Failed to create payment', 500);
    }
}

// PATCH /api/payments - Update payment status
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            paymentId,
            status,
            transactionId,
            upiRef,
            bankRefNumber,
            failureReason,
        } = body;

        if (!paymentId) {
            return errorResponse('Payment ID is required', 400);
        }

        await dbConnect();

        const payment = await Payment.findById(paymentId);
        if (!payment) {
            return errorResponse('Payment not found', 404);
        }

        if (status) payment.status = status;
        if (transactionId) payment.transactionId = transactionId;
        if (upiRef) payment.upiRef = upiRef;
        if (bankRefNumber) payment.bankRefNumber = bankRefNumber;
        if (failureReason) payment.failureReason = failureReason;

        // Set paidAt if completed
        if (status === 'completed' && !payment.paidAt) {
            payment.paidAt = new Date();
        }

        await payment.save();

        return successResponse(payment, 'Payment updated successfully');
    } catch (error) {
        console.error('Update payment error:', error);
        return errorResponse('Failed to update payment', 500);
    }
}
