import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';

// GET /api/operator/hubs - Public endpoint to list active hubs
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const city = searchParams.get('city');

        const query: Record<string, unknown> = { isActive: true };
        if (city) query.city = { $regex: city, $options: 'i' };

        const hubs = await Hub.find(query)
            .select('name code city state address contactPhone')
            .sort({ city: 1, name: 1 })
            .lean();

        return successResponse(hubs);
    } catch (error) {
        console.error('Get hubs for operator error:', error);
        return errorResponse('Failed to fetch hubs', 500);
    }
}
