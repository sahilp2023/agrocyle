import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import FarmPlot from '@/lib/models/FarmPlot';
import { successResponse, errorResponse } from '@/lib/utils';
import { getFarmerIdFromRequest } from '@/lib/utils/auth';
import { area } from '@turf/turf';

// GET /api/farm-plots - List plots for logged-in farmer
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const plots = await FarmPlot.find({ farmerId }).sort({ createdAt: -1 });

        return successResponse(plots);
    } catch (error) {
        console.error('Get farm plots error:', error);
        return errorResponse('Failed to fetch farm plots', 500);
    }
}

// POST /api/farm-plots - Create new plot
export async function POST(request: NextRequest) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { plotName, geometry } = body;

        if (!plotName || !geometry) {
            return errorResponse('Plot name and geometry are required', 400);
        }

        // Server-side area calculation
        const areaM2 = area(geometry);
        const areaAcre = areaM2 / 4046.8564224;
        const areaHa = areaM2 / 10000;

        await dbConnect();

        const plot = await FarmPlot.create({
            farmerId,
            plotName,
            geometry,
            areaM2,
            areaAcre,
            areaHa,
        });

        return successResponse(plot, 'Farm plot saved successfully');
    } catch (error) {
        console.error('Create farm plot error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to create farm plot',
            500
        );
    }
}
