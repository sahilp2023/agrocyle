import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Buyer from '@/lib/models/Buyer';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

void Buyer;
void Hub;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/hub/orders/[id] — get single order detail
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) return errorResponse('Unauthorized', 401);

        const { id } = await context.params;
        await dbConnect();

        console.log('[Hub Order GET] Manager hubId:', manager.hubId, 'Order id:', id);

        const order = await BuyerOrder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            hubId: new mongoose.Types.ObjectId(manager.hubId),
        })
            .populate('buyerId', 'companyName companyCode contactPerson phone email address')
            .populate('hubId', 'name city code')
            .lean();

        if (!order) {
            console.log('[Hub Order GET] Order not found for this hub');
            return errorResponse('Order not found', 404);
        }

        return successResponse(order);
    } catch (error) {
        console.error('Hub order detail GET error:', error);
        return errorResponse('Failed to fetch order', 500);
    }
}

// PATCH /api/hub/orders/[id] — update order (stock allocation, quality, shipment, dispatch)
export async function PATCH(request: NextRequest, context: RouteParams) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) return errorResponse('Unauthorized', 401);

        const { id } = await context.params;
        const body = await request.json();
        await dbConnect();

        console.log('[Hub Order PATCH] id:', id, 'hubId:', manager.hubId, 'action:', body.action);

        const order = await BuyerOrder.findOne({
            _id: new mongoose.Types.ObjectId(id),
            hubId: new mongoose.Types.ObjectId(manager.hubId),
        });

        if (!order) {
            console.log('[Hub Order PATCH] Order not found');
            return errorResponse('Order not found', 404);
        }

        console.log('[Hub Order PATCH] Current status:', order.status);

        // Stock allocation
        if (body.stockAllocated) {
            order.stockAllocated = {
                allocatedQtyTonnes: body.stockAllocated.allocatedQtyTonnes,
                allocatedAt: new Date(),
            };
            order.preparedBy = new mongoose.Types.ObjectId(manager.id);
            // Only set to 'processing' if NOT dispatching in the same request
            if (order.status === 'confirmed' && body.action !== 'dispatch') {
                order.status = 'processing';
            }
        }

        // Quality report
        if (body.qualityReport) {
            order.qualityReport = body.qualityReport;
        }

        // Shipment details
        if (body.shipmentDetails) {
            order.shipmentDetails = body.shipmentDetails;
        }

        // Dispatch action
        if (body.action === 'dispatch') {
            // Quality and shipment are being saved in the same request
            const hasQuality = order.qualityReport || body.qualityReport;
            const hasTracking = order.shipmentDetails?.trackingId || body.shipmentDetails?.trackingId;

            console.log('[Hub Order PATCH] Dispatch check — hasQuality:', !!hasQuality, 'hasTracking:', !!hasTracking);

            if (!hasQuality || !hasTracking) {
                return errorResponse('Quality report and tracking ID required before dispatch', 400);
            }

            order.status = 'dispatched';
            order.dispatchedDate = new Date();

            // Ensure shippingDate is set
            if (body.shipmentDetails?.shippingDate) {
                if (!order.shipmentDetails) {
                    order.shipmentDetails = body.shipmentDetails;
                }
                order.shipmentDetails!.shippingDate = new Date(body.shipmentDetails.shippingDate);
            } else if (order.shipmentDetails && !order.shipmentDetails.shippingDate) {
                order.shipmentDetails.shippingDate = new Date();
            }
        }

        // Deliver action
        if (body.action === 'deliver') {
            order.status = 'delivered';
            order.deliveredDate = new Date();
        }

        await order.save();
        console.log('[Hub Order PATCH] Saved successfully, new status:', order.status);

        const updated = await BuyerOrder.findById(id)
            .populate('buyerId', 'companyName companyCode contactPerson phone email')
            .populate('hubId', 'name city code')
            .lean();

        return successResponse(updated, 'Order updated successfully');
    } catch (error) {
        console.error('[Hub Order PATCH] Error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to update order: ${msg}`, 500);
    }
}
