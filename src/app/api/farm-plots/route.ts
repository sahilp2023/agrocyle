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
        const { plotName, geometry, manualAreaAcre } = body;

        if (!plotName) {
            return errorResponse('Plot name is required', 400);
        }

        // Either geometry or manualAreaAcre must be provided
        if (!geometry && (!manualAreaAcre || manualAreaAcre <= 0)) {
            return errorResponse('Either draw boundary on map or enter area manually', 400);
        }

        let areaM2: number;
        let areaAcre: number;
        let areaHa: number;
        let isManualEntry = false;

        if (geometry) {
            // Server-side area calculation from map drawing
            areaM2 = area(geometry);
            areaAcre = areaM2 / 4046.8564224;
            areaHa = areaM2 / 10000;
        } else {
            // Manual entry - calculate other units from acres
            areaAcre = parseFloat(manualAreaAcre);
            areaM2 = areaAcre * 4046.8564224;
            areaHa = areaAcre * 0.404686;
            isManualEntry = true;
        }

        await dbConnect();

        const plotData: any = {
            farmerId,
            plotName,
            areaM2,
            areaAcre,
            areaHa,
            isManualEntry,
        };

        // Only include geometry if it exists (for map-drawn plots)
        if (geometry) {
            plotData.geometry = geometry;
        }

        const plot = await FarmPlot.create(plotData);

        return successResponse(plot, 'Farm plot saved successfully');
    } catch (error) {
        console.error('Create farm plot error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to create farm plot',
            500
        );
    }
}
