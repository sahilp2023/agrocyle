import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import { successResponse, errorResponse } from '@/lib/utils';
import { getOperatorFromRequest } from '@/lib/utils/operatorAuth';

// POST /api/operator/location - Update operator's current GPS location
export async function POST(request: NextRequest) {
    try {
        const operatorAuth = getOperatorFromRequest(request);
        if (!operatorAuth) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { latitude, longitude } = body;

        if (latitude === undefined || longitude === undefined) {
            return errorResponse('Latitude and longitude are required', 400);
        }

        await dbConnect();

        await Operator.findByIdAndUpdate(operatorAuth.id, {
            currentLocation: {
                type: 'Point',
                coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
            },
        });

        return successResponse(null, 'Location updated');
    } catch (error) {
        console.error('Update location error:', error);
        return errorResponse('Failed to update location', 500);
    }
}
