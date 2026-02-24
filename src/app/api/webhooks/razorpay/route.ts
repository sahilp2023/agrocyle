import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Payout from '@/lib/models/Payout';
import { verifyWebhookSignature } from '@/lib/razorpay';

// POST /api/webhooks/razorpay - Handle Razorpay webhooks
export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature') || '';

        // Verify webhook signature
        const isValid = verifyWebhookSignature(rawBody, signature);
        if (!isValid) {
            console.error('Invalid Razorpay webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const event = payload.event;
        const entity = payload.payload?.payment?.entity || payload.payload?.payout?.entity;

        console.log('Razorpay webhook received:', event);

        await dbConnect();

        switch (event) {
            case 'payment.captured':
            case 'payment.authorized':
                await handlePaymentCaptured(entity);
                break;

            case 'payment.failed':
                await handlePaymentFailed(entity);
                break;

            case 'payout.processed':
                await handlePayoutProcessed(entity);
                break;

            case 'payout.failed':
            case 'payout.rejected':
                await handlePayoutFailed(entity);
                break;

            default:
                console.log('Unhandled Razorpay webhook event:', event);
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}

async function handlePaymentCaptured(payment: any) {
    const orderId = payment.notes?.orderId;
    if (!orderId) {
        console.log('No orderId in payment notes, skipping');
        return;
    }

    const order = await BuyerOrder.findById(orderId);
    if (!order) {
        console.error('Order not found for payment:', orderId);
        return;
    }

    // Update order payment status
    order.razorpayPaymentId = payment.id;
    order.paidAmount = payment.amount / 100; // Convert from paise
    order.paymentStatus = 'completed';

    if (order.status === 'pending') {
        order.status = 'confirmed';
    }

    await order.save();
    console.log('Order payment updated:', order.orderNumber);
}

async function handlePaymentFailed(payment: any) {
    const orderId = payment.notes?.orderId;
    if (!orderId) return;

    const order = await BuyerOrder.findById(orderId);
    if (order) {
        // Log the failure but don't change status (user can retry)
        console.log('Payment failed for order:', order.orderNumber, payment.error_description);
    }
}

async function handlePayoutProcessed(payout: any) {
    const payoutId = payout.reference_id;
    if (!payoutId) return;

    const payoutRecord = await Payout.findById(payoutId);
    if (payoutRecord) {
        payoutRecord.razorpayPayoutId = payout.id;
        payoutRecord.status = 'completed';
        payoutRecord.processedAt = new Date();
        await payoutRecord.save();
        console.log('Payout completed:', payoutId);
    }
}

async function handlePayoutFailed(payout: any) {
    const payoutId = payout.reference_id;
    if (!payoutId) return;

    const payoutRecord = await Payout.findById(payoutId);
    if (payoutRecord) {
        payoutRecord.status = 'failed';
        payoutRecord.notes = payout.failure_reason || 'Payout failed';
        await payoutRecord.save();
        console.log('Payout failed:', payoutId, payout.failure_reason);
    }
}
