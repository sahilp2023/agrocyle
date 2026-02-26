import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import { successResponse, errorResponse } from '@/lib/utils';
import { getOperatorFromRequest } from '@/lib/utils/operatorAuth';

// GET /api/operator/profile - Get operator profile
export async function GET(request: NextRequest) {
    try {
        const operatorAuth = getOperatorFromRequest(request);
        if (!operatorAuth) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const operator = await Operator.findById(operatorAuth.id)
            .select('-otp -otpExpiry')
            .populate('hubId', 'name code city');

        if (!operator) {
            return errorResponse('Operator not found', 404);
        }

        return successResponse(operator);
    } catch (error) {
        console.error('Get operator profile error:', error);
        return errorResponse('Failed to fetch profile', 500);
    }
}

// PATCH /api/operator/profile - Update operator profile
export async function PATCH(request: NextRequest) {
    try {
        const operatorAuth = getOperatorFromRequest(request);
        if (!operatorAuth) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            name,
            profilePhoto,
            operatorType,
            vehicleNumber,
            vehicleModel,
            licenseNumber,
            upiId,
            bankDetails,
            isOnline,
            hubId,
        } = body;

        await dbConnect();

        const updateData: Record<string, unknown> = {};
        if (name) updateData.name = name;
        if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
        if (vehicleNumber) updateData.vehicleNumber = vehicleNumber.toUpperCase();
        if (vehicleModel !== undefined) updateData.vehicleModel = vehicleModel;
        if (licenseNumber !== undefined) updateData.licenseNumber = licenseNumber;
        if (upiId !== undefined) updateData.upiId = upiId;
        if (bankDetails) updateData.bankDetails = bankDetails;
        if (isOnline !== undefined) updateData.isOnline = isOnline;
        if (hubId) updateData.hubId = hubId;
        if (operatorType && ['baler', 'truck', 'both'].includes(operatorType)) updateData.operatorType = operatorType;
        if (body.currentLocation && body.currentLocation.lat && body.currentLocation.lng) {
            updateData.currentLocation = {
                type: 'Point',
                coordinates: [body.currentLocation.lng, body.currentLocation.lat],
            };
            console.log('[Operator Profile] Saving location:', body.currentLocation.lat, body.currentLocation.lng);
        }

        console.log('[Operator Profile] Update fields:', Object.keys(updateData));
        const operator = await Operator.findByIdAndUpdate(
            operatorAuth.id,
            updateData,
            { new: true }
        ).select('-otp -otpExpiry');
        console.log('[Operator Profile] Location after save:', operator?.currentLocation);

        if (!operator) {
            return errorResponse('Operator not found', 404);
        }

        return successResponse(operator, 'Profile updated successfully');
    } catch (error) {
        console.error('Update operator profile error:', error);
        return errorResponse('Failed to update profile', 500);
    }
}
