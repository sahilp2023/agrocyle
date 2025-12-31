import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import Booking from '@/lib/models/Booking';
import Payment from '@/lib/models/Payment';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// GET /api/hub/payouts - Get payouts for a hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const farmerId = searchParams.get('farmerId');
        const status = searchParams.get('status');
        const { page, limit, skip } = getPaginationParams(searchParams);

        await dbConnect();

        const query: Record<string, unknown> = { hubId: manager.hubId };

        if (farmerId) {
            query.farmerId = farmerId;
        }

        if (status) {
            query.status = status;
        }

        const total = await Payout.countDocuments(query);
        const payouts = await Payout.find(query)
            .populate('farmerId', 'name phone village city')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return successResponse(payouts, undefined, createPaginationMeta(total, page, limit));
    } catch (error) {
        console.error('Get payouts error:', error);
        return errorResponse('Failed to fetch payouts', 500);
    }
}

// POST /api/hub/payouts - Create a new payout
export async function POST(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            farmerId,
            bookingIds,
            totalQuantityTonnes,
            basePrice,
            subsidyAmount,
            balingCost,
            logisticsDeduction,
            netPayable,
            notes,
        } = body;

        if (!farmerId || !netPayable) {
            return errorResponse('Farmer ID and net payable amount are required', 400);
        }

        await dbConnect();

        // Create payout record
        const payout = await Payout.create({
            farmerId,
            hubId: manager.hubId,
            bookingIds: bookingIds || [],
            totalQuantityTonnes: totalQuantityTonnes || 0,
            pricePerTonne: basePrice || 0,
            breakdown: {
                baseAmount: (totalQuantityTonnes || 0) * (basePrice || 0),
                subsidy: subsidyAmount || 0,
                balingCost: balingCost || 0,
                logisticsDeduction: logisticsDeduction || 0,
                netPayable: netPayable,
            },
            status: 'pending',
            notes,
        });

        // Mark bookings as payout initiated
        if (bookingIds && bookingIds.length > 0) {
            await Booking.updateMany(
                { _id: { $in: bookingIds } },
                { payoutInitiated: true }
            );
        }

        return successResponse(payout, 'Payout created successfully');
    } catch (error) {
        console.error('Create payout error:', error);
        return errorResponse('Failed to create payout', 500);
    }
}

// PATCH /api/hub/payouts - Update payout status
export async function PATCH(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { payoutId, status, transactionId } = body;

        if (!payoutId) {
            return errorResponse('Payout ID is required', 400);
        }

        await dbConnect();

        const payout = await Payout.findOneAndUpdate(
            { _id: payoutId, hubId: manager.hubId },
            {
                status,
                transactionId,
                ...(status === 'completed' ? { paidAt: new Date() } : {}),
            },
            { new: true }
        );

        if (!payout) {
            return errorResponse('Payout not found', 404);
        }

        // Update related payments
        if (status === 'completed') {
            await Payment.updateMany(
                { payoutId },
                { status: 'completed', paidAt: new Date(), transactionId }
            );
        }

        return successResponse(payout, 'Payout updated successfully');
    } catch (error) {
        console.error('Update payout error:', error);
        return errorResponse('Failed to update payout', 500);
    }
}
