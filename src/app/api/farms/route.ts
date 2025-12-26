import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Farm from '@/lib/models/Farm';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getFarmerIdFromRequest } from '@/lib/utils/auth';

// GET /api/farms - List farms
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const farmerId = searchParams.get('farmerId');
        const { page, limit, skip } = getPaginationParams(searchParams);

        const query: Record<string, unknown> = { isActive: true };
        if (farmerId) {
            query.farmerId = farmerId;
        }

        const total = await Farm.countDocuments(query);
        const farms = await Farm.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return successResponse(
            farms,
            undefined,
            createPaginationMeta(total, page, limit)
        );
    } catch (error) {
        console.error('Get farms error:', error);
        return errorResponse('Failed to fetch farms', 500);
    }
}

// POST /api/farms - Add new farm
export async function POST(request: NextRequest) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { name, cropType, areaInAcres, location } = body;

        if (!cropType || !areaInAcres || !location) {
            return errorResponse('Crop type, area, and location are required', 400);
        }

        if (areaInAcres < 0.1 || areaInAcres > 1000) {
            return errorResponse('Area must be between 0.1 and 1000 acres', 400);
        }

        await dbConnect();

        const farm = await Farm.create({
            farmerId,
            name: name || 'मेरा खेत',
            cropType,
            areaInAcres,
            location: {
                type: 'Point',
                coordinates: location.coordinates,
                address: location.address,
                village: location.village,
                district: location.district,
                state: location.state,
            },
        });

        return successResponse(farm, 'Farm added successfully');
    } catch (error) {
        console.error('Add farm error:', error);
        return errorResponse('Failed to add farm', 500);
    }
}

// PATCH /api/farms - Update farm
export async function PATCH(request: NextRequest) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { farmId, name, cropType, areaInAcres, location } = body;

        if (!farmId) {
            return errorResponse('Farm ID is required', 400);
        }

        await dbConnect();

        const farm = await Farm.findOne({ _id: farmId, farmerId });
        if (!farm) {
            return errorResponse('Farm not found', 404);
        }

        if (name) farm.name = name;
        if (cropType) farm.cropType = cropType;
        if (areaInAcres) farm.areaInAcres = areaInAcres;
        if (location) {
            farm.location = {
                type: 'Point',
                coordinates: location.coordinates || farm.location.coordinates,
                address: location.address || farm.location.address,
                village: location.village || farm.location.village,
                district: location.district || farm.location.district,
                state: location.state || farm.location.state,
            };
        }

        await farm.save();

        return successResponse(farm, 'Farm updated successfully');
    } catch (error) {
        console.error('Update farm error:', error);
        return errorResponse('Failed to update farm', 500);
    }
}

// DELETE /api/farms - Soft delete farm
export async function DELETE(request: NextRequest) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const farmId = searchParams.get('farmId');

        if (!farmId) {
            return errorResponse('Farm ID is required', 400);
        }

        await dbConnect();

        const farm = await Farm.findOneAndUpdate(
            { _id: farmId, farmerId },
            { isActive: false },
            { new: true }
        );

        if (!farm) {
            return errorResponse('Farm not found', 404);
        }

        return successResponse(null, 'Farm deleted successfully');
    } catch (error) {
        console.error('Delete farm error:', error);
        return errorResponse('Failed to delete farm', 500);
    }
}
