import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import BuyerDelivery from '@/lib/models/BuyerDelivery';
import BuyerOrder from '@/lib/models/BuyerOrder';
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

// GET /api/buyer/deliveries/[id] - Get single delivery
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

        const delivery = await BuyerDelivery.findOne({
            _id: id,
            buyerId: decoded.id
        })
            .populate('hubId', 'name city code')
            .populate('orderId', 'orderNumber quantityTonnes status');

        if (!delivery) {
            return errorResponse('Delivery not found', 404);
        }

        return successResponse({ delivery });
    } catch (error) {
        console.error('Get delivery error:', error);
        return errorResponse('Failed to fetch delivery', 500);
    }
}

// PUT /api/buyer/deliveries/[id] - Accept or reject delivery
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
        const { action, rejectionReason, notes } = body;

        if (!action || !['accept', 'reject'].includes(action)) {
            return errorResponse('Invalid action. Use "accept" or "reject"', 400);
        }

        await dbConnect();

        const delivery = await BuyerDelivery.findOne({
            _id: id,
            buyerId: decoded.id
        });

        if (!delivery) {
            return errorResponse('Delivery not found', 404);
        }

        // Only allow accept/reject if delivery is in 'delivered' status
        if (delivery.status !== 'delivered') {
            return errorResponse('Can only accept/reject deliveries that have arrived', 400);
        }

        if (action === 'accept') {
            delivery.status = 'accepted';
            delivery.acceptedAt = new Date();

            // Update order delivered quantity
            const order = await BuyerOrder.findById(delivery.orderId);
            if (order) {
                // Check if all deliveries for this order are accepted
                const pendingDeliveries = await BuyerDelivery.countDocuments({
                    orderId: order._id,
                    status: { $in: ['in_transit', 'delivered'] }
                });

                const totalDelivered = await BuyerDelivery.aggregate([
                    { $match: { orderId: order._id, status: 'accepted' } },
                    { $group: { _id: null, total: { $sum: '$quantityTonnes' } } }
                ]);

                const deliveredTonnes = (totalDelivered[0]?.total || 0) + delivery.quantityTonnes;

                if (pendingDeliveries === 1 && deliveredTonnes >= order.quantityTonnes) {
                    order.status = 'delivered';
                    order.deliveredDate = new Date();
                } else if (deliveredTonnes > 0) {
                    order.status = 'dispatched'; // Partially delivered
                }
                await order.save();
            }
        } else {
            delivery.status = 'rejected';
            delivery.rejectedAt = new Date();
            delivery.rejectionReason = rejectionReason || 'other';
        }

        if (notes) {
            delivery.notes = notes;
        }

        await delivery.save();

        return successResponse({ delivery }, `Delivery ${action}ed successfully`);
    } catch (error) {
        console.error('Update delivery error:', error);
        return errorResponse('Failed to update delivery', 500);
    }
}
