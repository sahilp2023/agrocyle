import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// GET /api/hub/operators - List operators for this hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const { searchParams } = new URL(request.url);
        const tab = searchParams.get('tab') || 'all'; // 'all', 'pending', 'verified'

        const query: Record<string, unknown> = { hubId: manager.hubId, isActive: true };
        if (tab === 'pending') query.isVerified = false;
        if (tab === 'verified') query.isVerified = true;

        const operators = await Operator.find(query)
            .select('-otp -otpExpiry')
            .sort({ createdAt: -1 })
            .lean();

        // Get counts
        const totalCount = await Operator.countDocuments({ hubId: manager.hubId, isActive: true });
        const pendingCount = await Operator.countDocuments({ hubId: manager.hubId, isActive: true, isVerified: false });
        const verifiedCount = await Operator.countDocuments({ hubId: manager.hubId, isActive: true, isVerified: true });

        return successResponse({
            operators,
            counts: { total: totalCount, pending: pendingCount, verified: verifiedCount },
        });
    } catch (error) {
        console.error('Get hub operators error:', error);
        return errorResponse('Failed to fetch operators', 500);
    }
}

// PATCH /api/hub/operators - Verify/reject/edit an operator
export async function PATCH(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { operatorId, action, updates } = body; // action: 'verify' | 'reject' | 'edit'

        if (!operatorId || !action) {
            return errorResponse('operatorId and action are required', 400);
        }

        if (!['verify', 'reject', 'edit'].includes(action)) {
            return errorResponse('Action must be verify, reject, or edit', 400);
        }

        await dbConnect();

        const operator = await Operator.findOne({ _id: operatorId, hubId: manager.hubId });
        if (!operator) {
            return errorResponse('Operator not found in your hub', 404);
        }

        if (action === 'verify') {
            operator.isVerified = true;
            await operator.save();
            return successResponse(operator, 'Operator verified successfully');
        } else if (action === 'edit') {
            // Allow editing name, vehicleNumber, vehicleModel, operatorType
            if (updates?.name) operator.name = updates.name;
            if (updates?.vehicleNumber) operator.vehicleNumber = updates.vehicleNumber.toUpperCase();
            if (updates?.vehicleModel !== undefined) operator.vehicleModel = updates.vehicleModel;
            if (updates?.operatorType && ['baler', 'truck', 'both'].includes(updates.operatorType)) {
                operator.operatorType = updates.operatorType;
            }
            await operator.save();
            return successResponse(operator, 'Operator updated successfully');
        } else {
            // Reject = deactivate
            operator.isActive = false;
            await operator.save();
            return successResponse(null, 'Operator rejected');
        }
    } catch (error) {
        console.error('Verify operator error:', error);
        return errorResponse('Failed to update operator', 500);
    }
}
