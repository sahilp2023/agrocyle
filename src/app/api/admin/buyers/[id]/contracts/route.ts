import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import BuyerContract from '@/lib/models/BuyerContract';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/buyers/[id]/contracts - List contracts
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const contracts = await BuyerContract.find({ buyerId: id })
            .sort({ uploadedAt: -1 });

        return successResponse(contracts);
    } catch (error) {
        console.error('Get contracts error:', error);
        return errorResponse('Failed to fetch contracts', 500);
    }
}

// POST /api/admin/buyers/[id]/contracts - Add contract (file URL)
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();
        const { title, type, fileUrl, validFrom, validUntil, notes } = body;

        if (!title || !type || !fileUrl || !validFrom) {
            return errorResponse('Title, type, file URL, and valid from date are required', 400);
        }

        await dbConnect();

        const contract = await BuyerContract.create({
            buyerId: id,
            title,
            type,
            fileUrl,
            validFrom: new Date(validFrom),
            validUntil: validUntil ? new Date(validUntil) : undefined,
            notes,
        });

        return successResponse(contract, 'Contract added successfully');
    } catch (error) {
        console.error('Add contract error:', error);
        return errorResponse('Failed to add contract', 500);
    }
}

// DELETE /api/admin/buyers/[id]/contracts - Remove contract
export async function DELETE(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { contractId } = body;

        if (!contractId) {
            return errorResponse('Contract ID required', 400);
        }

        await dbConnect();

        await BuyerContract.findByIdAndDelete(contractId);

        return successResponse({ message: 'Contract removed' });
    } catch (error) {
        console.error('Remove contract error:', error);
        return errorResponse('Failed to remove contract', 500);
    }
}
