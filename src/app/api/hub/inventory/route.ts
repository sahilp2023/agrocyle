import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import InventoryLog from '@/lib/models/InventoryLog';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';
import mongoose from 'mongoose';

// GET /api/hub/inventory - Get inventory entries for a hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'inbound' or 'outbound'
        const { page, limit, skip } = getPaginationParams(searchParams);

        await dbConnect();

        const hubId = new mongoose.Types.ObjectId(manager.hubId);

        const query: Record<string, unknown> = { hubId };

        if (type && type !== 'all') {
            query.type = type;
        }

        const total = await InventoryLog.countDocuments(query);
        const entries = await InventoryLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate stats
        const stats = await InventoryLog.aggregate([
            { $match: { hubId } },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$quantityTonnes' },
                },
            },
        ]);

        let totalInbound = 0;
        let totalOutbound = 0;
        stats.forEach((s: { _id: string; total: number }) => {
            if (s._id === 'inbound') totalInbound = s.total;
            if (s._id === 'outbound') totalOutbound = s.total;
        });

        return successResponse(
            {
                entries,
                stats: {
                    totalInbound,
                    totalOutbound,
                    currentStock: totalInbound - totalOutbound,
                },
            },
            undefined,
            createPaginationMeta(total, page, limit)
        );
    } catch (error) {
        console.error('Get inventory error:', error);
        return errorResponse('Failed to fetch inventory', 500);
    }
}

// POST /api/hub/inventory - Add new inventory entry
export async function POST(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            type,
            quantityTonnes,
            farmerName,
            buyerName,
            vehicleNumber,
            notes,
            assignmentId,
        } = body;

        if (!type || !quantityTonnes) {
            return errorResponse('Type and quantity are required', 400);
        }

        if (!['inbound', 'outbound'].includes(type)) {
            return errorResponse('Type must be inbound or outbound', 400);
        }

        await dbConnect();

        const entry = await InventoryLog.create({
            hubId: manager.hubId,
            type,
            quantityTonnes,
            buyerName: type === 'outbound' ? buyerName : undefined,
            bookingId: assignmentId || undefined,
            notes: [
                type === 'inbound' && farmerName ? `Farmer: ${farmerName}` : '',
                vehicleNumber ? `Vehicle: ${vehicleNumber}` : '',
                notes || '',
            ].filter(Boolean).join(' | ') || undefined,
            createdBy: manager.id,
        });

        return successResponse(entry, 'Inventory entry added successfully');
    } catch (error) {
        console.error('Add inventory error:', error);
        return errorResponse('Failed to add inventory entry', 500);
    }
}

// DELETE /api/hub/inventory - Delete an inventory entry
export async function DELETE(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const entryId = searchParams.get('entryId');

        if (!entryId) {
            return errorResponse('Entry ID is required', 400);
        }

        await dbConnect();

        const entry = await InventoryLog.findOneAndDelete({
            _id: entryId,
            hubId: manager.hubId,
        });

        if (!entry) {
            return errorResponse('Entry not found', 404);
        }

        return successResponse(null, 'Entry deleted successfully');
    } catch (error) {
        console.error('Delete inventory error:', error);
        return errorResponse('Failed to delete entry', 500);
    }
}
