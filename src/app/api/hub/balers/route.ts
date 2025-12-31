import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Baler from '@/lib/models/Baler';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// GET /api/hub/balers - Get all fleet vehicles (balers and trucks) for a hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const vehicles = await Baler.find({
            hubId: manager.hubId,
            isActive: true
        }).sort({ vehicleType: 1, createdAt: -1 });

        return successResponse(vehicles);
    } catch (error) {
        console.error('Get vehicles error:', error);
        return errorResponse('Failed to fetch vehicles', 500);
    }
}

// POST /api/hub/balers - Add new vehicle (baler or truck)
export async function POST(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            vehicleType,
            vehicleNumber,
            balerModel,
            operatorName,
            operatorPhone,
            ownerType,
            ownerName,
            timePerTonne,
            capacity,
        } = body;

        if (!vehicleNumber || !operatorName || !operatorPhone) {
            return errorResponse('Vehicle number, operator name and phone are required', 400);
        }

        await dbConnect();

        // Check for duplicate vehicle number
        const existing = await Baler.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
        if (existing) {
            return errorResponse('Vehicle with this number already exists', 400);
        }

        const vehicle = await Baler.create({
            vehicleType: vehicleType || 'baler',
            vehicleNumber: vehicleNumber.toUpperCase(),
            balerModel,
            operatorName,
            operatorPhone,
            ownerType: ownerType || 'platform',
            ownerName,
            timePerTonne: vehicleType === 'truck' ? undefined : (timePerTonne || 30),
            capacity: vehicleType === 'truck' ? (capacity || 5) : undefined,
            hubId: manager.hubId,
            status: 'available',
        });

        const typeLabel = vehicleType === 'truck' ? 'Truck' : 'Baler';
        return successResponse(vehicle, `${typeLabel} added successfully`);
    } catch (error) {
        console.error('Add vehicle error:', error);
        return errorResponse('Failed to add vehicle', 500);
    }
}

// PATCH /api/hub/balers - Update vehicle
export async function PATCH(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { balerId, status, vehicleType, timePerTonne, capacity, ...updates } = body;

        if (!balerId) {
            return errorResponse('Vehicle ID is required', 400);
        }

        await dbConnect();

        // Build update object
        const updateData: Record<string, unknown> = { ...updates };
        if (status) updateData.status = status;
        if (vehicleType) updateData.vehicleType = vehicleType;
        if (timePerTonne !== undefined) updateData.timePerTonne = timePerTonne;
        if (capacity !== undefined) updateData.capacity = capacity;

        const vehicle = await Baler.findOneAndUpdate(
            { _id: balerId, hubId: manager.hubId },
            updateData,
            { new: true }
        );

        if (!vehicle) {
            return errorResponse('Vehicle not found', 404);
        }

        return successResponse(vehicle, 'Vehicle updated successfully');
    } catch (error) {
        console.error('Update vehicle error:', error);
        return errorResponse('Failed to update vehicle', 500);
    }
}
