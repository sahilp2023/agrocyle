import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Booking from '@/lib/models/Booking';
import Farmer from '@/lib/models/Farmer';
import FarmPlot from '@/lib/models/FarmPlot';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure models are registered for populate
void Farmer;
void FarmPlot;

// GET /api/hub/requests - Get pickup requests for a hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const { page, limit, skip } = getPaginationParams(searchParams);

        await dbConnect();

        // Build query for bookings linked to this hub
        const query: Record<string, unknown> = { hubId: manager.hubId };

        if (status && status !== 'all') {
            query.status = status;
        }

        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .populate('farmerId', 'name phone village city pincode')
            .populate('farmId', 'plotName areaAcre')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return successResponse(
            bookings,
            undefined,
            createPaginationMeta(total, page, limit)
        );
    } catch (error) {
        console.error('Get hub requests error:', error);
        return errorResponse('Failed to fetch requests', 500);
    }
}
