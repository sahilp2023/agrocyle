import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import FarmPlot from '@/lib/models/FarmPlot';
import { successResponse, errorResponse } from '@/lib/utils';
import { getFarmerIdFromRequest } from '@/lib/utils/auth';
import { area } from '@turf/turf';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/farm-plots/[id] - Get single plot
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;

        await dbConnect();
        const plot = await FarmPlot.findOne({ _id: id, farmerId });

        if (!plot) {
            return errorResponse('Farm plot not found', 404);
        }

        return successResponse(plot);
    } catch (error) {
        console.error('Get farm plot error:', error);
        return errorResponse('Failed to fetch farm plot', 500);
    }
}

// PUT /api/farm-plots/[id] - Update plot
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;
        const body = await request.json();
        const { plotName, geometry } = body;

        await dbConnect();
        const plot = await FarmPlot.findOne({ _id: id, farmerId });

        if (!plot) {
            return errorResponse('Farm plot not found', 404);
        }

        if (plotName) plot.plotName = plotName;
        if (geometry) {
            plot.geometry = geometry;
            // Recalculate area
            const areaM2 = area(geometry);
            plot.areaM2 = areaM2;
            plot.areaAcre = areaM2 / 4046.8564224;
            plot.areaHa = areaM2 / 10000;
        }

        await plot.save();

        return successResponse(plot, 'Farm plot updated successfully');
    } catch (error) {
        console.error('Update farm plot error:', error);
        return errorResponse('Failed to update farm plot', 500);
    }
}

// DELETE /api/farm-plots/[id] - Delete plot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await params;

        await dbConnect();
        const result = await FarmPlot.findOneAndDelete({ _id: id, farmerId });

        if (!result) {
            return errorResponse('Farm plot not found', 404);
        }

        return successResponse(null, 'Farm plot deleted successfully');
    } catch (error) {
        console.error('Delete farm plot error:', error);
        return errorResponse('Failed to delete farm plot', 500);
    }
}
