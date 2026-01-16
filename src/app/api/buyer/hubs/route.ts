import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';

// GET /api/buyer/hubs - Get list of hubs for order creation
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const state = searchParams.get('state');
        const city = searchParams.get('city');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { isActive: true };
        if (state) query.state = state;
        if (city) query.city = city;

        const hubs = await Hub.find(query)
            .select('name code city state address')
            .sort({ state: 1, city: 1, name: 1 });

        return successResponse({ hubs });
    } catch (error) {
        console.error('Get hubs error:', error);
        return errorResponse('Failed to fetch hubs', 500);
    }
}
