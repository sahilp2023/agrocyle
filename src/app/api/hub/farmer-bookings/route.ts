import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Booking from '@/lib/models/Booking';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// GET /api/hub/farmer-bookings - Get completed bookings for a farmer (for payout calculation)
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const farmerId = searchParams.get('farmerId');

        if (!farmerId) {
            return errorResponse('Farmer ID is required', 400);
        }

        await dbConnect();

        // Get completed bookings that haven't been paid out yet
        const bookings = await Booking.find({
            hubId: manager.hubId,
            farmerId,
            status: 'completed',
            payoutInitiated: { $ne: true },
        })
            .populate('farmId', 'plotName areaAcre')
            .sort({ completedAt: -1 });

        // Calculate totals
        const totalQuantity = bookings.reduce(
            (sum, b) => sum + (b.actualStubbleTonnes || b.estimatedStubbleTonnes || 0),
            0
        );

        return successResponse({
            bookings,
            summary: {
                totalBookings: bookings.length,
                totalQuantityTonnes: totalQuantity,
            },
        });
    } catch (error) {
        console.error('Get farmer bookings error:', error);
        return errorResponse('Failed to fetch bookings', 500);
    }
}
